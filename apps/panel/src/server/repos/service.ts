import { and, eq, inArray, isNull, like, notInArray, or } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import type { GithubRepo } from '#/server/github/service.ts'
import { Database } from '../db/service.ts'
import { Github } from '../github/service.ts'
import { repos } from './drizzle.ts'

export type RepoStatus = 'active' | 'archived'

const toRepoValues = (item: GithubRepo) => ({
	githubId: item.githubId,
	owner: item.owner,
	name: item.name,
	description: item.description,
	stargazersCount: item.stargazersCount,
	pushedAt: item.pushedAt === null ? null : new Date(item.pushedAt),
})

/** The toggled-personal-project subset of my GitHub repos, plus their tags/status. */
export class Repos extends Context.Service<Repos>()('server/repos', {
	make: Effect.gen(function* () {
		const db = yield* Database
		const github = yield* Github

		const list = () =>
			db.use((client) =>
				client.select().from(repos).orderBy(repos.owner, repos.name)
			)

		const upsertFromGithub = (items: ReadonlyArray<GithubRepo>) =>
			db.use((client) =>
				Promise.all(
					items.map((item) => {
						const values = toRepoValues(item)
						return client
							.insert(repos)
							.values(values)
							.onConflictDoUpdate({
								target: repos.githubId,
								set: {
									owner: values.owner,
									name: values.name,
									description: values.description,
									stargazersCount: values.stargazersCount,
									pushedAt: values.pushedAt,
								},
							})
					})
				)
			)

		const syncFromGithub = () =>
			Effect.gen(function* () {
				const githubRepos = yield* github.listOwnRepos()
				yield* upsertFromGithub(githubRepos)
				const githubIds = githubRepos.map((repo) => repo.githubId)
				const now = new Date()

				if (githubIds.length === 0) {
					yield* db.use((client) =>
						client
							.update(repos)
							.set({ deletedAt: now })
							.where(isNull(repos.deletedAt))
					)
				} else {
					yield* db.use((client) =>
						Promise.all([
							client
								.update(repos)
								.set({ deletedAt: now })
								.where(
									and(
										isNull(repos.deletedAt),
										notInArray(repos.githubId, githubIds)
									)
								),
							client
								.update(repos)
								.set({ deletedAt: null })
								.where(inArray(repos.githubId, githubIds)),
						])
					)
				}

				return githubRepos.length
			})

		const hardDelete = (id: number) =>
			db.use((client) => client.delete(repos).where(eq(repos.id, id)))

		const setPersonal = (id: number, isPersonalProject: boolean) =>
			db.use((client) =>
				client
					.update(repos)
					.set({ isPersonalProject, updatedAt: new Date() })
					.where(eq(repos.id, id))
			)

		const setTags = (id: number, tags: ReadonlyArray<string>) =>
			db.use((client) =>
				client
					.update(repos)
					.set({ tags: [...tags], updatedAt: new Date() })
					.where(eq(repos.id, id))
			)

		const setStatus = (
			id: number,
			status: RepoStatus,
			year: number | undefined
		) =>
			db.use((client) =>
				client
					.update(repos)
					.set({ status, year, updatedAt: new Date() })
					.where(eq(repos.id, id))
			)

		const listPersonalKeys = () =>
			db.use((client) =>
				client
					.select({ owner: repos.owner, name: repos.name })
					.from(repos)
					.where(eq(repos.isPersonalProject, true))
			)

		const listPersonalProjects = (options: {
			search?: string
			tags?: ReadonlyArray<string>
		}) =>
			db
				.use((client) => {
					const conditions = [
						eq(repos.isPersonalProject, true),
						isNull(repos.deletedAt),
					]
					const search = options.search
					if (search != null && search !== '') {
						const term = `%${search}%`
						const searchCondition = or(
							like(repos.name, term),
							like(repos.description, term)
						)
						if (searchCondition) conditions.push(searchCondition)
					}
					return client
						.select()
						.from(repos)
						.where(and(...conditions))
				})
				.pipe(
					Effect.map((rows) => {
						const tags = options.tags
						if (tags == null || tags.length === 0) return rows
						return rows.filter((row) =>
							tags.every((tag) => row.tags.includes(tag))
						)
					})
				)

		return {
			list,
			upsertFromGithub,
			syncFromGithub,
			hardDelete,
			setPersonal,
			setTags,
			setStatus,
			listPersonalKeys,
			listPersonalProjects,
		}
	}),
}) {
	static layer = Layer.effect(Repos, this.make)
}
