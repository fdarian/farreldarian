import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { Github } from '#/server/github/service.ts'
import { Repos } from '#/server/repos/service.ts'
import { runServerEffect } from '#/server/run-server-effect.ts'
import { protectedServerFn } from '#/server/server-fn.ts'
import { Contributions } from './service.ts'

/** Every org behind a detected open-source PR, flagged with its current exclude state. */
export const listOpenSourceOrgs = protectedServerFn({ method: 'GET' }).handler(
	() =>
		runServerEffect(
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
			})
		)
)

export const setOrgExcluded = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(S.Struct({ owner: S.String, excluded: S.Boolean }))
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const contributions = yield* Contributions
				if (data.excluded) {
					yield* contributions.excludeOrg(data.owner)
				} else {
					yield* contributions.includeOrg(data.owner)
				}
			})
		)
	)
