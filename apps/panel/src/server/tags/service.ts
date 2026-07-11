import { eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { Database } from '../db/service.ts'
import { repos } from '../repos/drizzle.ts'
import { tags } from './drizzle.ts'

type RepoSummary = {
	id: number
	owner: string
	name: string
	isPersonalProject: boolean
}

export type TagListEntry = {
	name: string
	description: string | null
	isPinned: boolean
	pinnedOrder: number
	projectOrder: number[]
	repos: RepoSummary[]
}

type TagRow = typeof tags.$inferSelect

/** Orders `repoList` by `projectOrder` (ids in that order first), stale ids ignored, then appends any repo carrying the tag but absent from `projectOrder`, stable by the incoming order (owner/name). */
const sortReposByProjectOrder = (
	repoList: ReadonlyArray<RepoSummary>,
	projectOrder: ReadonlyArray<number>
): RepoSummary[] => {
	const repoById = new Map(repoList.map((repo) => [repo.id, repo]))
	const ordered = projectOrder
		.map((id) => repoById.get(id))
		.filter((repo): repo is RepoSummary => repo != null)
	const orderedIds = new Set(ordered.map((repo) => repo.id))
	const rest = repoList.filter((repo) => !orderedIds.has(repo.id))
	return [...ordered, ...rest]
}

const assembleTagEntry = (
	name: string,
	tagRow: TagRow | undefined,
	repoList: ReadonlyArray<RepoSummary>
): TagListEntry => ({
	name,
	description: tagRow?.description ?? null,
	isPinned: tagRow?.isPinned ?? false,
	pinnedOrder: tagRow?.pinnedOrder ?? 0,
	projectOrder: tagRow?.projectOrder ?? [],
	repos: sortReposByProjectOrder(repoList, tagRow?.projectOrder ?? []),
})

const compareTagEntries = (a: TagListEntry, b: TagListEntry) => {
	if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
	if (a.isPinned) return a.pinnedOrder - b.pinnedOrder
	return a.name.localeCompare(b.name)
}

const buildTagList = (
	repoRows: ReadonlyArray<RepoSummary & { tags: ReadonlyArray<string> }>,
	tagRows: ReadonlyArray<TagRow>
): TagListEntry[] => {
	const tagRowByName = new Map(tagRows.map((row) => [row.name, row]))
	const reposByTag = new Map<string, RepoSummary[]>()
	for (const repo of repoRows) {
		for (const tagName of repo.tags) {
			const existing = reposByTag.get(tagName) ?? []
			existing.push({
				id: repo.id,
				owner: repo.owner,
				name: repo.name,
				isPersonalProject: repo.isPersonalProject,
			})
			reposByTag.set(tagName, existing)
		}
	}
	const entries = Array.from(reposByTag.entries(), ([name, repoList]) =>
		assembleTagEntry(name, tagRowByName.get(name), repoList)
	)
	return entries.sort(compareTagEntries)
}

/** Metadata over the tag strings living in `repos.tags` — pin order, description, per-tag project priority. Backs the web "Highlights" section. */
export class Tags extends Context.Service<Tags>()('server/tags', {
	make: Effect.gen(function* () {
		const db = yield* Database

		const list = () =>
			db
				.use((client) =>
					Promise.all([
						client
							.select({
								id: repos.id,
								owner: repos.owner,
								name: repos.name,
								isPersonalProject: repos.isPersonalProject,
								tags: repos.tags,
							})
							.from(repos)
							.orderBy(repos.owner, repos.name),
						client.select().from(tags),
					])
				)
				.pipe(
					Effect.map(([repoRows, tagRows]) => buildTagList(repoRows, tagRows))
				)

		const setDescription = (name: string, description: string) => {
			const value = description === '' ? null : description
			const now = new Date()
			return db.use((client) =>
				client
					.insert(tags)
					.values({ name, description: value, updatedAt: now })
					.onConflictDoUpdate({
						target: tags.name,
						set: { description: value, updatedAt: now },
					})
			)
		}

		const setPinned = (name: string, isPinned: boolean) => {
			const now = new Date()
			if (!isPinned) {
				return db.use((client) =>
					client
						.insert(tags)
						.values({ name, isPinned: false, updatedAt: now })
						.onConflictDoUpdate({
							target: tags.name,
							set: { isPinned: false, updatedAt: now },
						})
				)
			}
			return db.use(async (client) => {
				const pinnedRows = await client
					.select({ pinnedOrder: tags.pinnedOrder })
					.from(tags)
					.where(eq(tags.isPinned, true))
				const nextOrder =
					pinnedRows.reduce((max, row) => Math.max(max, row.pinnedOrder), 0) + 1
				return client
					.insert(tags)
					.values({
						name,
						isPinned: true,
						pinnedOrder: nextOrder,
						updatedAt: now,
					})
					.onConflictDoUpdate({
						target: tags.name,
						set: { isPinned: true, pinnedOrder: nextOrder, updatedAt: now },
					})
			})
		}

		const reorderPinned = (names: ReadonlyArray<string>) => {
			const now = new Date()
			return db.use((client) =>
				Promise.all(
					names.map((name, index) =>
						client
							.insert(tags)
							.values({
								name,
								isPinned: true,
								pinnedOrder: index,
								updatedAt: now,
							})
							.onConflictDoUpdate({
								target: tags.name,
								set: { pinnedOrder: index, updatedAt: now },
							})
					)
				)
			)
		}

		const reorderProjects = (name: string, repoIds: ReadonlyArray<number>) => {
			const projectOrder = [...repoIds]
			const now = new Date()
			return db.use((client) =>
				client
					.insert(tags)
					.values({ name, projectOrder, updatedAt: now })
					.onConflictDoUpdate({
						target: tags.name,
						set: { projectOrder, updatedAt: now },
					})
			)
		}

		return {
			list,
			setDescription,
			setPinned,
			reorderPinned,
			reorderProjects,
		}
	}),
}) {
	static layer = Layer.effect(Tags, this.make)
}
