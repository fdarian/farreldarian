import { ContributionsSyncResponse, PanelApi } from '@repo/api-contract'
import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { Contributions } from '#/server/contributions/service.ts'

export const ContributionsApiLive = HttpApiBuilder.group(
	PanelApi,
	'contributions',
	(handlers) =>
		handlers.handle('sync', () =>
			Effect.gen(function* () {
				const contributions = yield* Contributions

				if (!(yield* contributions.hasHistory())) {
					// The full backfill is slow and rate-limited — don't block this
					// request (an api-key-authed cron call) on it. Kick it off in the
					// background and report back immediately; the next cron run picks
					// up incrementally from wherever the backfill got to.
					yield* Effect.forkDetach(contributions.backfill())
					return new ContributionsSyncResponse({
						mode: 'backfill-started',
						synced: 0,
					})
				}

				const synced = yield* contributions.incrementalSync()
				return new ContributionsSyncResponse({ mode: 'incremental', synced })
			}).pipe(Effect.orDie)
		)
)
