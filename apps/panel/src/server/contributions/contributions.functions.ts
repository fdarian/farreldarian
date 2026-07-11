import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { authMiddleware } from '#/server/auth/session.functions.ts'
import { Github } from '#/server/github/service.ts'
import { Repos } from '#/server/repos/service.ts'
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

/** Every org behind a detected open-source PR, flagged with its current exclude state. */
export const listOpenSourceOrgs = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const contributions = yield* Contributions
			const github = yield* Github
			const repos = yield* Repos

			const personalKeys = yield* repos.listPersonalKeys()
			return yield* contributions.listOpenSourceOrgs({
				username: github.username,
				personalRepoKeys: new Set(
					personalKeys.map((key) => `${key.owner}/${key.name}`)
				),
			})
		}).pipe(RuntimeServer.runPromise)
	)

export const setOrgExcluded = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(
		S.toStandardSchemaV1(S.Struct({ owner: S.String, excluded: S.Boolean }))
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const contributions = yield* Contributions
			if (data.excluded) {
				yield* contributions.excludeOrg(data.owner)
			} else {
				yield* contributions.includeOrg(data.owner)
			}
		}).pipe(RuntimeServer.runPromise)
	)
