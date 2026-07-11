import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import { authMiddleware } from '#/server/auth/session.functions.ts'
import { RuntimeServer } from '#/server/runtime.ts'
import { Contributions } from './service.ts'

/**
 * On-demand catch-up sync — cheap (usually a single request, since it only
 * fetches PRs updated since the last sync). The full history backfill is a
 * separate one-off script (`contributions:backfill`), not exposed here.
 */
export const syncContributions = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const contributions = yield* Contributions
			yield* contributions.incrementalSync()
		}).pipe(RuntimeServer.runPromise)
	)
