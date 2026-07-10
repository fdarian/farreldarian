import {
	ActivityItem,
	ActivityResponse,
	PanelApi,
	Project,
} from '@repo/api-contract'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { Github } from '#/server/github/service.ts'
import { Repos } from '#/server/repos/service.ts'

export const FeedApiLive = HttpApiBuilder.group(PanelApi, 'feed', (handlers) =>
	handlers
		.handle('activity', () =>
			Effect.gen(function* () {
				const github = yield* Github
				const repos = yield* Repos

				const [pullRequests, personalKeys] = yield* Effect.all([
					github.listMergedPullRequests(),
					repos.listPersonalKeys(),
				])

				const personalRepoKeys = new Set(
					personalKeys.map((key) => `${key.owner}/${key.name}`)
				)

				const items = pullRequests.map(
					(pr) =>
						new ActivityItem({
							title: pr.title,
							href: pr.href,
							description: `#${pr.number} in ${pr.repo}`,
							repo: pr.repo,
							updatedAt: pr.updatedAt,
							number: pr.number,
						})
				)

				return new ActivityResponse({
					projects: items.filter((item) => personalRepoKeys.has(item.repo)),
					openSource: items.filter((item) => !personalRepoKeys.has(item.repo)),
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
