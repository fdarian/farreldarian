import { desc, max } from 'drizzle-orm'
import { Context, Effect, Layer, Option } from 'effect'
import type { GithubError, GithubSearchIssue } from '#/server/github/service.ts'
import { Github } from '#/server/github/service.ts'
import type { DbError } from '../db/service.ts'
import { Database } from '../db/service.ts'
import { mergedPullRequests } from './drizzle.ts'

export type MergedPullRequest = {
	githubId: number
	repo: string
	number: number
	title: string
	href: string
	mergedAt: Date
	updatedAt: Date
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
				fetchWindow(HISTORY_START, new Date())

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

					if (Option.isNone(since)) {
						// Nothing synced yet. Deliberately doesn't fall back to `backfill()`
						// here — this runs unattended on every boot (see below), and a full
						// history bisection is exactly the "hammering GitHub" this table
						// exists to avoid. Bootstrapping is `contributions:backfill`'s job.
						yield* Effect.logWarning(
							'[contributions] no history synced yet — run `bun contributions:backfill`'
						)
						return 0
					}

					const query = `author:${github.username} is:pr is:merged updated:>=${since.value.toISOString()}`
					const totalCount = yield* countIssues(query).pipe(
						Effect.tap(() => Effect.sleep(RATE_LIMIT_DELAY))
					)

					if (totalCount > SEARCH_RESULT_CAP) {
						yield* Effect.logWarning(
							`[contributions] ${totalCount} merged PRs updated since last sync — beyond the ${SEARCH_RESULT_CAP} cap, re-run \`contributions:backfill\` to fill the gap`
						)
					}

					return yield* fetchAllPages(query, totalCount)
				})

			// Fire-and-forget on boot: keeps the table warm without blocking app
			// startup or failing it when GitHub is unreachable/token is missing.
			// `forkDetach` (not `forkChild`) so it keeps running independent of
			// whichever request fiber happened to construct this service first.
			yield* incrementalSync()
				.pipe(
					Effect.catch((error: GithubError | DbError) =>
						Effect.logWarning('[contributions] boot sync failed').pipe(
							Effect.annotateLogs({ error })
						)
					)
				)
				.pipe(Effect.forkDetach)

			return { list, backfill, incrementalSync, hasHistory }
		}),
	}
) {
	static layer = Layer.effect(Contributions, this.make)
}
