import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { runServerEffect } from '../run-server-effect.ts'
import { protectedServerFn } from '../server-fn.ts'
import { Repos } from './service.ts'

/** Locally stored GitHub repos, including records soft-deleted by sync. */
export const listRepos = protectedServerFn({ method: 'GET' }).handler(() =>
	runServerEffect(
		Effect.gen(function* () {
			const repos = yield* Repos
			return yield* repos.list()
		})
	)
)

export const hardDeleteRepo = protectedServerFn({ method: 'POST' })
	.validator(S.toStandardSchemaV1(S.Struct({ id: S.Number })))
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const repos = yield* Repos
				yield* repos.hardDelete(data.id)
			})
		)
	)

export const setRepoPersonal = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(
			S.Struct({ id: S.Number, isPersonalProject: S.Boolean })
		)
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const repos = yield* Repos
				yield* repos.setPersonal(data.id, data.isPersonalProject)
			})
		)
	)

export const setRepoTags = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(S.Struct({ id: S.Number, tags: S.Array(S.String) }))
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const repos = yield* Repos
				yield* repos.setTags(data.id, data.tags)
			})
		)
	)

export const setRepoStatus = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(
			S.Struct({
				id: S.Number,
				status: S.Literals(['active', 'archived']),
				year: S.optional(S.Number),
			})
		)
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const repos = yield* Repos
				yield* repos.setStatus(data.id, data.status, data.year)
			})
		)
	)
