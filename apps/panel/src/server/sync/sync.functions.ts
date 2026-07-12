import { Effect } from 'effect'
import { protectedServerFn } from '../server-fn.ts'
import { Sync } from './service.ts'

export const getSyncState = protectedServerFn({ method: 'GET' }).effect(() =>
	Effect.gen(function* () {
		const sync = yield* Sync
		return yield* sync.listState()
	})
)

export const runSync = protectedServerFn({ method: 'POST' }).effect(() =>
	Effect.gen(function* () {
		const sync = yield* Sync
		return yield* sync.syncAll()
	})
)
