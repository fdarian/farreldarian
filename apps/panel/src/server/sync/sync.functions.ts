import { Effect } from 'effect'
import { runServerEffect } from '../run-server-effect.ts'
import { protectedServerFn } from '../server-fn.ts'
import { Sync } from './service.ts'

export const getSyncState = protectedServerFn({ method: 'GET' }).handler(() =>
	runServerEffect(
		Effect.gen(function* () {
			const sync = yield* Sync
			return yield* sync.listState()
		})
	)
)

export const runSync = protectedServerFn({ method: 'POST' }).handler(() =>
	runServerEffect(
		Effect.gen(function* () {
			const sync = yield* Sync
			return yield* sync.syncAll()
		})
	)
)
