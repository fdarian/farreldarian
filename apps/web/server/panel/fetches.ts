import 'server-only'

import {
	ActivityResponse,
	HighlightsResponse,
	ProjectsQuery,
	ProjectsResponse,
} from '@repo/api-contract'
import { Effect, Schema } from 'effect'
import { cacheLife, cacheTag } from 'next/cache'
import { CacheLife, CacheTags } from '@/server/cache'
import { Panel } from '@/server/panel/client'
import { RuntimeServer } from '@/server/runtime'

export async function getActivity(): Promise<
	(typeof ActivityResponse)['Encoded']
> {
	'use cache'
	cacheLife(CacheLife.common)
	cacheTag(CacheTags.activity)

	return Effect.gen(function* () {
		const client = yield* Panel
		const activity = yield* client.feed.activity({})
		// `ActivityResponse`/`ActivityItem` decode into Schema.Class instances,
		// which RSC can't serialize across the server/client boundary — encode
		// back to a plain object before returning.
		return Schema.encodeSync(ActivityResponse)(activity)
	}).pipe(RuntimeServer.runPromise)
}

export async function listProjects(
	query?: ConstructorParameters<typeof ProjectsQuery>[0]
): Promise<(typeof ProjectsResponse)['Encoded']> {
	'use cache'
	cacheLife(CacheLife.common)
	cacheTag(CacheTags.projects)

	return Effect.gen(function* () {
		const client = yield* Panel
		// `ProjectsQuery` is a Class schema — encoding it for the request
		// requires an actual class instance, not a plain object, so we
		// construct one here rather than pushing that onto callers.
		const projects = yield* client.feed.projects({
			query: new ProjectsQuery(query ?? {}),
		})
		// `Project` decodes into a Schema.Class instance, which RSC can't
		// serialize across the server/client boundary — encode back to a
		// plain object before returning.
		return Schema.encodeSync(ProjectsResponse)(projects)
	}).pipe(RuntimeServer.runPromise)
}

export async function getHighlights(): Promise<
	(typeof HighlightsResponse)['Encoded']
> {
	'use cache'
	cacheLife(CacheLife.common)
	cacheTag(CacheTags.highlight)

	return Effect.gen(function* () {
		const client = yield* Panel
		const highlights = yield* client.feed.highlights({})
		// `Highlight`/`HighlightProject` decode into Schema.Class instances,
		// which RSC can't serialize across the server/client boundary —
		// encode back to a plain object before returning.
		return Schema.encodeSync(HighlightsResponse)(highlights)
	}).pipe(RuntimeServer.runPromise)
}
