import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { authMiddleware } from '#/server/auth/session.functions.ts'
import { Github } from '#/server/github/service.ts'
import { RuntimeServer } from '#/server/runtime.ts'
import { Repos } from './service.ts'

/** GitHub repos I own, merged with the local toggle/tags/status state. */
export const listRepos = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const github = yield* Github
			const repos = yield* Repos

			const githubRepos = yield* github.listOwnRepos()
			yield* repos.upsertFromGithub(githubRepos)
			return yield* repos.list()
		}).pipe(RuntimeServer.runPromise)
	)

export const setRepoPersonal = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(
		S.toStandardSchemaV1(
			S.Struct({ id: S.Number, isPersonalProject: S.Boolean })
		)
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const repos = yield* Repos
			yield* repos.setPersonal(data.id, data.isPersonalProject)
		}).pipe(RuntimeServer.runPromise)
	)

export const setRepoTags = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(
		S.toStandardSchemaV1(S.Struct({ id: S.Number, tags: S.Array(S.String) }))
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const repos = yield* Repos
			yield* repos.setTags(data.id, data.tags)
		}).pipe(RuntimeServer.runPromise)
	)

export const setRepoStatus = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
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
		Effect.gen(function* () {
			const repos = yield* Repos
			yield* repos.setStatus(data.id, data.status, data.year)
		}).pipe(RuntimeServer.runPromise)
	)
