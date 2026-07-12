import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { runServerEffect } from '#/server/run-server-effect.ts'
import { protectedServerFn } from '#/server/server-fn.ts'
import { Tags } from './service.ts'

/** The assembled Highlights view: every tag carried by a repo, with its metadata + ordered repos. */
export const listTags = protectedServerFn({ method: 'GET' }).handler(() =>
	runServerEffect(
		Effect.gen(function* () {
			const tags = yield* Tags
			return yield* tags.list()
		})
	)
)

export const setTagDescription = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(S.Struct({ name: S.String, description: S.String }))
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const tags = yield* Tags
				yield* tags.setDescription(data.name, data.description)
			})
		)
	)

export const setTagPinned = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(S.Struct({ name: S.String, isPinned: S.Boolean }))
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const tags = yield* Tags
				yield* tags.setPinned(data.name, data.isPinned)
			})
		)
	)

export const reorderPinnedTags = protectedServerFn({ method: 'POST' })
	.validator(S.toStandardSchemaV1(S.Struct({ names: S.Array(S.String) })))
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const tags = yield* Tags
				yield* tags.reorderPinned(data.names)
			})
		)
	)

export const reorderTagProjects = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(
			S.Struct({ name: S.String, repoIds: S.Array(S.Number) })
		)
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const tags = yield* Tags
				yield* tags.reorderProjects(data.name, data.repoIds)
			})
		)
	)

/** Adds/removes a single repo from a tag's curated pinned-projects set. */
export const setTagProjectPinned = protectedServerFn({ method: 'POST' })
	.validator(
		S.toStandardSchemaV1(
			S.Struct({ name: S.String, repoId: S.Number, pinned: S.Boolean })
		)
	)
	.handler(({ data }) =>
		runServerEffect(
			Effect.gen(function* () {
				const tags = yield* Tags
				yield* tags.setProjectPinned(data.name, data.repoId, data.pinned)
			})
		)
	)
