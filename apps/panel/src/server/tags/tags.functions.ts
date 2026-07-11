import { createServerFn } from '@tanstack/react-start'
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { authMiddleware } from '#/server/auth/session.functions.ts'
import { RuntimeServer } from '#/server/runtime.ts'
import { Tags } from './service.ts'

/** The assembled Highlights view: every tag carried by a repo, with its metadata + ordered repos. */
export const listTags = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const tags = yield* Tags
			return yield* tags.list()
		}).pipe(RuntimeServer.runPromise)
	)

export const setTagDescription = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(
		S.toStandardSchemaV1(S.Struct({ name: S.String, description: S.String }))
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const tags = yield* Tags
			yield* tags.setDescription(data.name, data.description)
		}).pipe(RuntimeServer.runPromise)
	)

export const setTagPinned = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(
		S.toStandardSchemaV1(S.Struct({ name: S.String, isPinned: S.Boolean }))
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const tags = yield* Tags
			yield* tags.setPinned(data.name, data.isPinned)
		}).pipe(RuntimeServer.runPromise)
	)

export const reorderPinnedTags = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(S.toStandardSchemaV1(S.Struct({ names: S.Array(S.String) })))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const tags = yield* Tags
			yield* tags.reorderPinned(data.names)
		}).pipe(RuntimeServer.runPromise)
	)

export const reorderTagProjects = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(
		S.toStandardSchemaV1(
			S.Struct({ name: S.String, repoIds: S.Array(S.Number) })
		)
	)
	.handler(({ data }) =>
		Effect.gen(function* () {
			const tags = yield* Tags
			yield* tags.reorderProjects(data.name, data.repoIds)
		}).pipe(RuntimeServer.runPromise)
	)
