import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import { Effect } from 'effect'
import { Contributions } from '#/server/contributions/service.ts'
import { layerMain } from '#/server/runtime.ts'

/**
 * One-time (rerunnable) full-history backfill of merged PRs into sqlite — see
 * `src/server/contributions/service.ts` for the date-windowing that works
 * around the Search API's 1000-result cap. Safe to run again later: upserts
 * by GitHub PR id, so it just re-syncs anything that's changed.
 */
Effect.gen(function* () {
	yield* Effect.logInfo(
		'[contributions:backfill] starting full-history backfill'
	)
	const contributions = yield* Contributions
	yield* contributions.backfill()
	yield* Effect.logInfo('[contributions:backfill] done')
}).pipe(Effect.provide(layerMain), BunRuntime.runMain)
