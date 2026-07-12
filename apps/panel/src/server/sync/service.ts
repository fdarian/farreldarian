import { Context, Effect, Layer } from 'effect'
import { Contributions } from '../contributions/service.ts'
import { Database } from '../db/service.ts'
import { Repos } from '../repos/service.ts'
import { syncState } from './drizzle.ts'

type SyncDomain = 'repos' | 'contributions'

type SyncResult = {
	domain: SyncDomain
	ok: boolean
	count: number
	error?: string
}

/** Runs both remote reconciliation domains and persists display-only sync status. */
export class Sync extends Context.Service<Sync>()('server/sync', {
	make: Effect.gen(function* () {
		const db = yield* Database
		const repos = yield* Repos
		const contributions = yield* Contributions

		const listState = () => db.use((client) => client.select().from(syncState))

		const record = (
			domain: SyncDomain,
			result: Effect.Effect<number, unknown>
		) =>
			result.pipe(
				Effect.map((count): SyncResult => ({ domain, ok: true, count })),
				Effect.catch(
					(error): Effect.Effect<SyncResult> =>
						Effect.succeed({
							domain,
							ok: false,
							count: 0,
							error: String(error),
						})
				),
				Effect.tap((summary) => {
					const now = new Date()
					return db.use((client) =>
						client
							.insert(syncState)
							.values({
								domain,
								lastSyncedAt: summary.ok ? now : null,
								lastError: summary.ok ? null : summary.error,
							})
							.onConflictDoUpdate({
								target: syncState.domain,
								set: summary.ok
									? { lastSyncedAt: now, lastError: null }
									: { lastError: summary.error },
							})
					)
				})
			)

		const syncAll = () =>
			Effect.all([
				record('repos', repos.syncFromGithub()),
				record('contributions', contributions.sync()),
			])

		return { listState, syncAll }
	}),
}) {
	static layer = Layer.effect(Sync, this.make)
}
