import { defineConfig } from 'drizzle-kit'
import { Effect } from 'effect'
import { databaseUrl } from './src/server/db/service.ts'

export default Effect.gen(function* () {
	const url = yield* databaseUrl

	return defineConfig({
		dialect: 'sqlite',
		schema: './src/server/db/models',
		migrations: { table: '__drizzle_migrations_panel' },
		dbCredentials: { url },
	})
}).pipe(Effect.runSync)
