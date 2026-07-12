import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { Github } from '#/server/github/service.ts'
import { protectedServerFn } from '../server-fn.ts'
import { Repos } from './service.ts'

/** GitHub repos I own, merged with the local toggle/tags/status state. */
export const listRepos = protectedServerFn({ method: 'GET' }).effect(() =>
	Effect.gen(function* () {
		const github = yield* Github
		const repos = yield* Repos

		const githubRepos = yield* github.listOwnRepos()
		yield* repos.upsertFromGithub(githubRepos)
		return yield* repos.list()
	})
)

export const setRepoPersonal = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(
			S.Struct({ id: S.Number, isPersonalProject: S.Boolean })
		)
	)
	.effect(({ data }) =>
		Effect.gen(function* () {
			const repos = yield* Repos
			yield* repos.setPersonal(data.id, data.isPersonalProject)
		})
	)

export const setRepoTags = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(S.Struct({ id: S.Number, tags: S.Array(S.String) }))
	)
	.effect(({ data }) =>
		Effect.gen(function* () {
			const repos = yield* Repos
			yield* repos.setTags(data.id, data.tags)
		})
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
	.effect(({ data }) =>
		Effect.gen(function* () {
			const repos = yield* Repos
			yield* repos.setStatus(data.id, data.status, data.year)
		})
	)
