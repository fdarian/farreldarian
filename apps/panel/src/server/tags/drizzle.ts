import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * Metadata for a tag string (the same value stored in `repos.tags`). A row is
 * created lazily (upsert) the first time a tag is pinned/described/reordered —
 * tags with no row still show up in `Tags.list()`'s aggregation, with defaults.
 */
export const tags = sqliteTable('tags', {
	name: text().primaryKey(),
	description: text(),
	isPinned: integer({ mode: 'boolean' }).notNull().default(false),
	// Tab order among pinned tags.
	pinnedOrder: integer().notNull().default(0),
	// Ordered `repos.id` list — this tag's project priority.
	projectOrder: text({ mode: 'json' })
		.$type<number[]>()
		.notNull()
		.$defaultFn(() => []),
	createdAt: integer({ mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer({ mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})
