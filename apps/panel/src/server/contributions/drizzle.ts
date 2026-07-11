import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/**
 * My merged GitHub PRs, backfilled + incrementally synced from the Search API
 * (see `service.ts`). Exists so `activity` can serve a complete history from
 * sqlite instead of hitting GitHub's rate-limited, 1000-result-capped search
 * endpoint on every request.
 */
export const mergedPullRequests = sqliteTable(
	'merged_pull_requests',
	{
		id: integer().primaryKey({ autoIncrement: true }),
		githubId: integer().notNull().unique(),
		repo: text().notNull(),
		number: integer().notNull(),
		title: text().notNull(),
		href: text().notNull(),
		mergedAt: integer({ mode: 'timestamp' }).notNull(),
		updatedAt: integer({ mode: 'timestamp' }).notNull(),
		syncedAt: integer({ mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [index('merged_pull_requests_merged_at_idx').on(table.mergedAt)]
)

/**
 * GitHub orgs/owners whose open-source PRs are hidden from the activity feed
 * (toggled from the panel's contributions-management UI). Never affects
 * personal projects or repos I own — only the "open source" bucket.
 */
export const excludedOrgs = sqliteTable('excluded_orgs', {
	owner: text().primaryKey(),
	createdAt: integer({ mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
})
