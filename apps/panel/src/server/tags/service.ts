import { eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'
import { Database } from '../db/service.ts'
import { repos } from '../repos/drizzle.ts'
import { tags } from './drizzle.ts'

type RepoSummary = {
	id: number
	owner: string
	name: string
	description: string | null
	isPersonalProject: boolean
}

export type TagListEntry = {
	name: string
	description: string | null
	isPinned: boolean
	pinnedOrder: number
	// The curated, ordered subset of `repos` below that's actually pinned —
	// an explicit opt-in set, not "every repo carrying the tag".
	projectOrder: number[]
	// Every repo carrying the tag (personal or not), alphabetical by
	// owner/name — the candidate pool the route picks `projectOrder` from.
	repos: RepoSummary[]
}

type TagRow = typeof tags.$inferSelect

export type HighlightTagRepo = {
	id: number
	owner: string
	name: string
	description: string | null
	pushedAt: Date | null
}

export type HighlightTag = {
	name: string
	description: string | null
	repos: HighlightTagRepo[]
}

/** Picks `items` by id in exactly `order`'s sequence — items whose id isn't in `order` are dropped, stale ids (no longer a match) are simply skipped. */
const pickByOrder = <T extends { id: number }>(
	items: ReadonlyArray<T>,
	order: ReadonlyArray<number>
): T[] => {
	const byId = new Map(items.map((item) => [item.id, item]))
	return order
		.map((id) => byId.get(id))
		.filter((item): item is T => item != null)
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
	repos: [...repoList],
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
				description: repo.description,
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
								description: repos.description,
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

		/** Pinned tags only, tab-ordered by `pinnedOrder`, each with only its curated `projectOrder` repos, in that order — backs the web `/highlights` endpoint. */
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
								pushedAt: repos.pushedAt,
							})
							.from(repos)
							.orderBy(repos.owner, repos.name),
					])
				)
				.pipe(
					Effect.map(([pinnedTagRows, repoRows]): HighlightTag[] =>
						pinnedTagRows.map((tagRow) => ({
							name: tagRow.name,
							description: tagRow.description,
							repos: pickByOrder(repoRows, tagRow.projectOrder),
						}))
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

		/** Adds/removes a single repo from the curated `projectOrder` set — append on add, drop on remove. Leaves the rest of the order untouched. */
		const setProjectPinned = (
			name: string,
			repoId: number,
			pinned: boolean
		) => {
			const now = new Date()
			return db.use(async (client) => {
				const existing = await client
					.select({ projectOrder: tags.projectOrder })
					.from(tags)
					.where(eq(tags.name, name))
				const currentOrder = existing[0]?.projectOrder ?? []
				const alreadyPinned = currentOrder.includes(repoId)
				const projectOrder = pinned
					? alreadyPinned
						? currentOrder
						: [...currentOrder, repoId]
					: currentOrder.filter((id) => id !== repoId)
				return client
					.insert(tags)
					.values({ name, projectOrder, updatedAt: now })
					.onConflictDoUpdate({
						target: tags.name,
						set: { projectOrder, updatedAt: now },
					})
			})
		}

		return {
			list,
			listPinnedWithProjects,
			setDescription,
			setPinned,
			reorderPinned,
			reorderProjects,
			setProjectPinned,
		}
	}),
}) {
	static layer = Layer.effect(Tags, this.make)
}
