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

export type HighlightTagRepo = {
	id: number
	owner: string
	name: string
	description: string | null
}

export type HighlightTag = {
	name: string
	description: string | null
	repos: HighlightTagRepo[]
}

/** Orders `items` by `projectOrder` (ids in that order first), stale ids ignored, then appends any item absent from `projectOrder`, stable by the incoming order. */
const sortByProjectOrder = <T extends { id: number }>(
	items: ReadonlyArray<T>,
	projectOrder: ReadonlyArray<number>
): T[] => {
	const byId = new Map(items.map((item) => [item.id, item]))
	const ordered = projectOrder
		.map((id) => byId.get(id))
		.filter((item): item is T => item != null)
	const orderedIds = new Set(ordered.map((item) => item.id))
	const rest = items.filter((item) => !orderedIds.has(item.id))
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
	repos: sortByProjectOrder(repoList, tagRow?.projectOrder ?? []),
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

		/** Pinned tags only, tab-ordered by `pinnedOrder`, each with its repos (any repo carrying the tag) project-ordered — backs the web `/highlights` endpoint. */
		const listPinnedWithProjects = () =>
			db
				.use((client) =>
					Promise.all([
						client
							.select({
								name: tags.name,
								description: tags.description,
								projectOrder: tags.projectOrder,
							})
							.from(tags)
							.where(eq(tags.isPinned, true))
							.orderBy(tags.pinnedOrder),
						client
							.select({
								id: repos.id,
								owner: repos.owner,
								name: repos.name,
								description: repos.description,
								tags: repos.tags,
							})
							.from(repos)
							.orderBy(repos.owner, repos.name),
					])
				)
				.pipe(
					Effect.map(([pinnedTagRows, repoRows]): HighlightTag[] =>
						pinnedTagRows.map((tagRow) => {
							const carriers = repoRows.filter((repo) =>
								repo.tags.includes(tagRow.name)
							)
							const ordered = sortByProjectOrder(carriers, tagRow.projectOrder)
							return {
								name: tagRow.name,
								description: tagRow.description,
								repos: ordered.map((repo) => ({
									id: repo.id,
									owner: repo.owner,
									name: repo.name,
									description: repo.description,
								})),
							}
						})
					)
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
			listPinnedWithProjects,
			setDescription,
			setPinned,
			reorderPinned,
			reorderProjects,
		}
	}),
}) {
	static layer = Layer.effect(Tags, this.make)
}
