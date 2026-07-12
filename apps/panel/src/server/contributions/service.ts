import { desc, eq, max } from 'drizzle-orm'
import { Context, Effect, Layer, Option } from 'effect'
import type { GithubError, GithubSearchIssue } from '#/server/github/service.ts'
import { Github } from '#/server/github/service.ts'
import { Revalidation } from '#/server/revalidation/service.ts'
import type { DbError } from '../db/service.ts'
import { Database } from '../db/service.ts'
import { excludedOrgs, mergedPullRequests } from './drizzle.ts'

export type MergedPullRequest = {
	githubId: number
	repo: string
	number: number
	title: string
	href: string
	mergedAt: Date
	updatedAt: Date
}

export type OpenSourceOrg = {
	owner: string
	excluded: boolean
}

export type OpenSourceContext = {
	username: string
	personalRepoKeys: ReadonlySet<string>
}

const ownerOf = (repo: string): string | undefined => repo.split('/')[0]

/**
 * True when a PR's repo counts as an "open source" contribution — not a
 * toggled personal project, and not a repo I own (owned-but-untoggled repos
 * shouldn't leak into open source just because nobody's flipped the toggle
 * yet). Single source of truth: used by both the activity filter and the
 * org-exclusion list below.
 */
export const isOpenSourceRepo = (
	repo: string,
	ctx: OpenSourceContext
): boolean => {
	const owner = ownerOf(repo)
	if (owner === undefined) return false
	if (ctx.personalRepoKeys.has(repo)) return false
	return owner.toLowerCase() !== ctx.username.toLowerCase()
}

const PER_PAGE = 100
// GitHub Search API hard cap — a query can never page past this many results.
const SEARCH_RESULT_CAP = 1000
// Search API is rate-limited to 30 req/min for authenticated requests.
const RATE_LIMIT_DELAY = '2100 millis'
// A safe lower bound for "since the beginning of history" (before GitHub existed).
const HISTORY_START = new Date('2008-01-01')
const ONE_DAY_MS = 24 * 60 * 60 * 1000

const isoDate = (date: Date) => date.toISOString().slice(0, 10)

const hasMergedAt = (
	item: GithubSearchIssue
): item is GithubSearchIssue & { mergedAt: string } => item.mergedAt !== null

/**
 * Local mirror of my merged GitHub PRs (`Github.searchIssues`, persisted).
 * Serving `activity` from here instead of live GitHub avoids the Search
 * API's 1000-result cap and 30-req/min rate limit on every request — the
 * live client only ever saw a single page anyway.
 */
export class Contributions extends Context.Service<Contributions>()(
	'server/contributions',
	{
		make: Effect.gen(function* () {
			const db = yield* Database
			const github = yield* Github
			const revalidation = yield* Revalidation

			// Best-effort: a failed revalidation call must never fail the sync
			// that triggered it — the web app just keeps serving its cached
			// snapshot a bit longer (up to `cacheLife('hours')`) instead.
			const notifyRevalidation = (): Effect.Effect<void> =>
				revalidation
					.revalidate()
					.pipe(
						Effect.catch((error) =>
							Effect.logWarning('[contributions] revalidation failed').pipe(
								Effect.annotateLogs({ error })
							)
						)
					)

			const list = (): Effect.Effect<
				ReadonlyArray<MergedPullRequest>,
				DbError
			> =>
				db.use((client) =>
					client
						.select()
						.from(mergedPullRequests)
						.orderBy(desc(mergedPullRequests.mergedAt))
				)

			const listExcludedOwners = (): Effect.Effect<
				ReadonlySet<string>,
				DbError
			> =>
				db
					.use((client) =>
						client.select({ owner: excludedOrgs.owner }).from(excludedOrgs)
					)
					.pipe(Effect.map((rows) => new Set(rows.map((row) => row.owner))))

			const excludeOrg = (owner: string): Effect.Effect<void, DbError> =>
				db.use((client) =>
					client.insert(excludedOrgs).values({ owner }).onConflictDoNothing()
				)

			const includeOrg = (owner: string): Effect.Effect<void, DbError> =>
				db.use((client) =>
					client.delete(excludedOrgs).where(eq(excludedOrgs.owner, owner))
				)

			// Every distinct owner behind an open-source PR, each flagged with
			// whether it's currently excluded — feeds the panel's exclusion UI.
			// Orgs are derived from what's actually in the DB, never hardcoded.
			const listOpenSourceOrgs = (
				ctx: OpenSourceContext
			): Effect.Effect<ReadonlyArray<OpenSourceOrg>, DbError> =>
				Effect.gen(function* () {
					const rows = yield* db.use((client) =>
						client
							.selectDistinct({ repo: mergedPullRequests.repo })
							.from(mergedPullRequests)
					)
					const excludedOwners = yield* listExcludedOwners()

					const owners = new Set(
						rows
							.map((row) => row.repo)
							.filter((repo) => isOpenSourceRepo(repo, ctx))
							.map(ownerOf)
							.filter((owner): owner is string => owner !== undefined)
					)

					return Array.from(owners)
						.sort()
						.map((owner) => ({ owner, excluded: excludedOwners.has(owner) }))
				})

			const upsertPage = (
				items: ReadonlyArray<GithubSearchIssue>
			): Effect.Effect<number, DbError> =>
				db.use((client) => {
					const merged = items.filter(hasMergedAt)
					return Promise.all(
						merged.map((item) =>
							client
								.insert(mergedPullRequests)
								.values({
									githubId: item.githubId,
									repo: item.repo,
									number: item.number,
									title: item.title,
									href: item.href,
									mergedAt: new Date(item.mergedAt),
									updatedAt: new Date(item.updatedAt),
								})
								.onConflictDoUpdate({
									target: mergedPullRequests.githubId,
									set: {
										repo: item.repo,
										title: item.title,
										href: item.href,
										updatedAt: new Date(item.updatedAt),
										syncedAt: new Date(),
									},
								})
						)
					).then(() => merged.length)
				})

			const countIssues = (query: string): Effect.Effect<number, GithubError> =>
				github
					.searchIssues(query, { perPage: 1 })
					.pipe(Effect.map((page) => page.totalCount))

			const fetchAndUpsertPage = (
				query: string,
				page: number
			): Effect.Effect<number, GithubError | DbError> =>
				github
					.searchIssues(query, { page, perPage: PER_PAGE })
					.pipe(Effect.flatMap((result) => upsertPage(result.items)))

			// Sequential on purpose — respects the 30 req/min search rate limit via
			// the fixed delay after each page, rather than firing pages concurrently.
			// Returns the number of PRs upserted across all pages.
			const fetchAllPages = (
				query: string,
				totalCount: number
			): Effect.Effect<number, GithubError | DbError> => {
				const pageCount = Math.min(
					Math.ceil(totalCount / PER_PAGE),
					SEARCH_RESULT_CAP / PER_PAGE
				)
				const pages = Array.from({ length: pageCount }, (_, i) => i + 1)
				return Effect.forEach(pages, (page) =>
					fetchAndUpsertPage(query, page).pipe(
						Effect.tap(() => Effect.sleep(RATE_LIMIT_DELAY))
					)
				).pipe(Effect.map((counts) => counts.reduce((a, b) => a + b, 0)))
			}

			// Works around the Search API's 1000-result cap by bisecting the
			// `merged:` date window until each slice's `total_count` fits under it,
			// then paging through that slice normally. Returns the number of PRs
			// upserted across the whole window.
			const fetchWindow = (
				since: Date,
				until: Date
			): Effect.Effect<number, GithubError | DbError> =>
				Effect.gen(function* () {
					const query = `author:${github.username} is:pr is:merged merged:${isoDate(since)}..${isoDate(until)}`
					const totalCount = yield* countIssues(query).pipe(
						Effect.tap(() => Effect.sleep(RATE_LIMIT_DELAY))
					)

					const canSplit = until.getTime() - since.getTime() > ONE_DAY_MS
					if (totalCount > SEARCH_RESULT_CAP && canSplit) {
						const midpoint = new Date((since.getTime() + until.getTime()) / 2)
						const synced = yield* fetchWindow(since, midpoint)
						return synced + (yield* fetchWindow(midpoint, until))
					}

					if (totalCount > SEARCH_RESULT_CAP) {
						yield* Effect.logWarning(
							`[contributions] ${isoDate(since)}..${isoDate(until)} has ${totalCount} merged PRs in a single day — only the first ${SEARCH_RESULT_CAP} will sync (GitHub Search API's hard cap)`
						)
					}

					return yield* fetchAllPages(query, totalCount)
				})

			const backfill = (): Effect.Effect<number, GithubError | DbError> =>
				fetchWindow(HISTORY_START, new Date()).pipe(
					Effect.tap(() => notifyRevalidation())
				)

			const lastSyncedUpdatedAt = (): Effect.Effect<
				Option.Option<Date>,
				DbError
			> =>
				db
					.use((client) =>
						client
							.select({ value: max(mergedPullRequests.updatedAt) })
							.from(mergedPullRequests)
					)
					.pipe(Effect.map((rows) => Option.fromNullishOr(rows[0]?.value)))

			const hasHistory = (): Effect.Effect<boolean, DbError> =>
				lastSyncedUpdatedAt().pipe(Effect.map(Option.isSome))

			// Cheap catch-up for subsequent runs — only fetches what changed since
			// the last sync instead of re-walking all of history. Returns the
			// number of PRs upserted (0 when nothing has changed, or when nothing
			// has synced yet — see below).
			const incrementalSync = (): Effect.Effect<
				number,
				GithubError | DbError
			> =>
				Effect.gen(function* () {
					const since = yield* lastSyncedUpdatedAt()
					if (Option.isNone(since)) return 0

					const query = `author:${github.username} is:pr is:merged updated:>=${since.value.toISOString()}`
					const totalCount = yield* countIssues(query).pipe(
						Effect.tap(() => Effect.sleep(RATE_LIMIT_DELAY))
					)

					if (totalCount > SEARCH_RESULT_CAP) {
						yield* Effect.logWarning(
							`[contributions] ${totalCount} merged PRs updated since last sync — beyond the ${SEARCH_RESULT_CAP} cap; run Sync again after the current window completes`
						)
					}

					return yield* fetchAllPages(query, totalCount)
				}).pipe(Effect.tap(() => notifyRevalidation()))

			const sync = (): Effect.Effect<number, GithubError | DbError> =>
				hasHistory().pipe(
					Effect.flatMap((hasHistory) =>
						hasHistory ? incrementalSync() : backfill()
					)
				)

			return {
				list,
				backfill,
				incrementalSync,
				sync,
				hasHistory,
				listExcludedOwners,
				listOpenSourceOrgs,
				excludeOrg,
				includeOrg,
			}
		}),
	}
) {
	static layer = Layer.effect(Contributions, this.make)
}
