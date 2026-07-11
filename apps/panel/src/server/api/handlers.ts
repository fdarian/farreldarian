import {
	ActivityItem,
	ActivityResponse,
	PanelApi,
	Project,
} from '@repo/api-contract'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { Contributions } from '#/server/contributions/service.ts'
import { Github } from '#/server/github/service.ts'
import { Repos } from '#/server/repos/service.ts'

export const FeedApiLive = HttpApiBuilder.group(PanelApi, 'feed', (handlers) =>
	handlers
		.handle('activity', () =>
			Effect.gen(function* () {
				const github = yield* Github
				const repos = yield* Repos
				const contributions = yield* Contributions

				// Read from the sqlite mirror, not live GitHub — see
				// `contributions/service.ts` for why (the Search API's 1000-result
				// cap + 30-req/min rate limit make it unfit for a per-request fetch).
				const [pullRequests, personalKeys] = yield* Effect.all([
					contributions.list(),
					repos.listPersonalKeys(),
				])

				const personalRepoKeys = new Set(
					personalKeys.map((key) => `${key.owner}/${key.name}`)
				)
				const isOwnRepo = (repo: string) =>
					repo.split('/')[0]?.toLowerCase() === github.username.toLowerCase()

				const items = pullRequests.map(
					(pr) =>
						new ActivityItem({
							title: pr.title,
							href: pr.href,
							description: `#${pr.number} in ${pr.repo}`,
							repo: pr.repo,
							updatedAt: pr.mergedAt.toISOString(),
							number: pr.number,
						})
				)

				// A PR is "personal" if the repo is toggled `isPersonalProject` OR I
				// own the repo (owned-but-untoggled repos shouldn't leak into open
				// source just because nobody's flipped the toggle yet). "openSource"
				// is only genuinely external repos.
				return new ActivityResponse({
					projects: items.filter((item) => personalRepoKeys.has(item.repo)),
					openSource: items.filter(
						(item) => !personalRepoKeys.has(item.repo) && !isOwnRepo(item.repo)
					),
				})
			}).pipe(Effect.orDie)
		)
		.handle('projects', ({ query }) =>
			Effect.gen(function* () {
				const repos = yield* Repos
				const rows = yield* repos.listPersonalProjects({
					search: query.search,
					tags: query.tags,
				})

				return rows.map(
					(row) =>
						new Project({
							name: row.name,
							href: `https://github.com/${row.owner}/${row.name}`,
							description: row.description ?? '',
							tags: row.tags,
							status: row.status,
							year: row.year ?? undefined,
							updatedAt: row.updatedAt.toISOString(),
						})
				)
			}).pipe(Effect.orDie)
		)
)
