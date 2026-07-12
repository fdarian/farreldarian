import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const syncState = sqliteTable('sync_state', {
	domain: text({ enum: ['repos', 'contributions'] }).primaryKey(),
	lastSyncedAt: integer({ mode: 'timestamp' }),
	lastError: text(),
})
