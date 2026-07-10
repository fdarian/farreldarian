import { Config, Context, Effect, Layer, Schema } from 'effect'
import * as reposSchema from '../repos/drizzle.ts'
import * as authSchema from './models/auth.ts'

const schema = { ...authSchema, ...reposSchema }

export const databaseUrl = Config.string('DATABASE_URL').pipe(
	Config.withDefault('./data/panel.sqlite')
)

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
		const client = drizzle(url, { schema })
		type DrizzleClient = typeof client

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
