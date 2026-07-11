import {
	ActivityItem,
	ActivityResponse,
	PanelApi,
	Project,
} from '@repo/api-contract'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import {
	Contributions,
	isOpenSourceRepo,
} from '#/server/contributions/service.ts'
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
				const [pullRequests, personalKeys, excludedOwners] = yield* Effect.all([
					contributions.list(),
					repos.listPersonalKeys(),
					contributions.listExcludedOwners(),
				])

				const personalRepoKeys = new Set(
					personalKeys.map((key) => `${key.owner}/${key.name}`)
				)
				const openSourceContext = {
					username: github.username,
					personalRepoKeys,
				}

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

				// "openSource" is genuinely external repos (see `isOpenSourceRepo` for
				// the personal/own-repo exclusions), minus any org the panel's
				// contributions-management UI has toggled off. Exclusion never
				// touches `projects` — personal projects and owned repos are unaffected.
				return new ActivityResponse({
					projects: items.filter((item) => personalRepoKeys.has(item.repo)),
					openSource: items.filter((item) => {
						if (!isOpenSourceRepo(item.repo, openSourceContext)) return false
						const owner = item.repo.split('/')[0]
						return owner !== undefined && !excludedOwners.has(owner)
					}),
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
							stars: row.stargazersCount ?? undefined,
							pushedAt: row.pushedAt?.toISOString(),
						})
				)
			}).pipe(Effect.orDie)
		)
)
