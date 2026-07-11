import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'
import { Config, Context, Effect, Layer, Schema } from 'effect'
import * as contributionsSchema from '../contributions/drizzle.ts'
import * as reposSchema from '../repos/drizzle.ts'
import * as authSchema from './models/auth.ts'

const schema = { ...authSchema, ...reposSchema, ...contributionsSchema }

export const databaseUrl = Config.string('DATABASE_URL').pipe(
	Config.withDefault('./data/panel.sqlite')
)

// Matches drizzle.config.ts's default output dir + migrations table — kept in
// sync manually since drizzle-kit doesn't expose its resolved config for reuse.
const migrationsFolder = Config.string('MIGRATIONS_FOLDER').pipe(
	Config.withDefault('./drizzle')
)
const migrationsTable = '__drizzle_migrations_panel'

// `Schema.Defect` is broken in effect@4.0.0-beta.97 (crashes building the AST) —
// `Schema.Unknown` is the workaround until it's fixed upstream.
export class DbError extends Schema.TaggedErrorClass<DbError>()('DbError', {
	cause: Schema.Unknown,
}) {
	constructor(cause: unknown) {
		super({ cause })
	}
}

export class Database extends Context.Service<Database>()('server/db', {
	make: Effect.gen(function* () {
		const url = yield* databaseUrl
		yield* Effect.logInfo(`[db] connected to ${url}`)

		// Lazily imported: importing `drizzle-orm/bun-sqlite` eagerly pulls in the
		// `bun:sqlite` builtin, which isn't resolvable under the Node-based loaders
		// that the better-auth CLI (jiti) and drizzle-kit's own CLI use to read
		// `entries/better-auth.ts` / `drizzle.config.ts` — those never construct a
		// real Database (dummy layer / no live DB needed for `generate`).
		const { drizzle } = yield* Effect.promise(
			() => import('drizzle-orm/bun-sqlite')
		)

		// bun:sqlite refuses to create the db file if its parent directory
		// doesn't exist yet — a fresh checkout/deploy won't have `data/`.
		if (url !== ':memory:') {
			yield* Effect.sync(() => mkdirSync(dirname(url), { recursive: true }))
		}

		const client = drizzle(url, { schema })
		type DrizzleClient = typeof client

		// Auto-migrate on boot — sqlite is file-based with no separate
		// provisioning step, so a fresh checkout/deploy should just create the
		// db and apply pending migrations rather than requiring a manual
		// `bun db:migrate` first. `migrationsFolder` defaults to the same
		// `./drizzle` dir drizzle-kit writes to, resolved relative to cwd (same
		// convention as `DATABASE_URL`'s default above) — the app must be
		// started from `apps/panel` with that folder present alongside it.
		const folder = yield* migrationsFolder
		yield* Effect.try({
			try: () => migrate(client, { migrationsFolder: folder, migrationsTable }),
			catch: (cause) => new DbError(cause),
		})
		yield* Effect.logInfo(`[db] migrated (${folder})`)

		return {
			client,
			use: <T>(fn: (db: DrizzleClient) => Promise<T>) =>
				Effect.tryPromise({
					try: () => fn(client),
					catch: (cause) => new DbError(cause),
				}),
		}
	}),
}) {
	static layer = Layer.effect(Database, this.make)
}
