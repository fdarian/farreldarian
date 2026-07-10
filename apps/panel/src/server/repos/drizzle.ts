import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** GitHub repos, toggled on to appear as "personal projects" in the feed/projects API. */
export const repos = sqliteTable('repos', {
	id: integer().primaryKey({ autoIncrement: true }),
	githubId: integer().notNull().unique(),
	owner: text().notNull(),
	name: text().notNull(),
	description: text(),
	isPersonalProject: integer({ mode: 'boolean' }).notNull().default(false),
	tags: text({ mode: 'json' })
		.$type<string[]>()
		.notNull()
		.$defaultFn(() => []),
	status: text({ enum: ['active', 'archived'] })
		.notNull()
		.default('active'),
	year: integer(),
	createdAt: integer({ mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer({ mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})
