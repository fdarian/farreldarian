import 'server-only'

import {
	ActivityResponse,
	HighlightsResponse,
	PanelApi,
	ProjectsQuery,
	ProjectsResponse,
} from '@repo/api-contract'
import { Effect, Schema } from 'effect'
import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from 'effect/unstable/http'
import { HttpApiClient } from 'effect/unstable/httpapi'
import { cacheLife, cacheTag } from 'next/cache'

/** Reads and validates the panel API credentials, throwing when either is missing. */
function panelCredentials() {
	const baseUrl = process.env.PANEL_API_URL
	const apiKey = process.env.PANEL_API_KEY
	if (!baseUrl || !apiKey) {
		throw new Error(
			'PANEL_API_URL and PANEL_API_KEY must be set to reach the panel API'
		)
	}
	return { baseUrl, apiKey }
}

/** Builds the typed `PanelApi` client, attaching the api key to every request. */
function makePanelClient(baseUrl: string, apiKey: string) {
	return HttpApiClient.make(PanelApi, {
		baseUrl,
		transformClient: HttpClient.mapRequest(
			HttpClientRequest.setHeader('Authorization', apiKey)
		),
	})
}

export async function getActivity(): Promise<
	(typeof ActivityResponse)['Encoded']
> {
	'use cache'
	cacheLife('common')
	// Lets the panel force a fresh fetch on demand (see
	// `apps/web/app/api/revalidate/route.ts`) once a sync actually lands new
	// rows, instead of waiting out the full hour.
	cacheTag('activity')

	const { baseUrl, apiKey } = panelCredentials()
	return Effect.runPromise(
		Effect.gen(function* () {
			const client = yield* makePanelClient(baseUrl, apiKey)
			const activity = yield* client.feed.activity({})
			// `ActivityResponse`/`ActivityItem` decode into Schema.Class instances,
			// which RSC can't serialize across the server/client boundary — encode
			// back to a plain object before returning.
			return Schema.encodeSync(ActivityResponse)(activity)
		}).pipe(Effect.provide(FetchHttpClient.layer))
	)
}

export async function listProjects(
	query?: ConstructorParameters<typeof ProjectsQuery>[0]
): Promise<(typeof ProjectsResponse)['Encoded']> {
	'use cache'
	cacheLife('common')
	cacheTag('projects')

	const { baseUrl, apiKey } = panelCredentials()
	return Effect.runPromise(
		Effect.gen(function* () {
			const client = yield* makePanelClient(baseUrl, apiKey)
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
		}).pipe(Effect.provide(FetchHttpClient.layer))
	)
}

export async function getHighlights(): Promise<
	(typeof HighlightsResponse)['Encoded']
> {
	'use cache'
	cacheLife('common')
	cacheTag('highlights')

	const { baseUrl, apiKey } = panelCredentials()
	return Effect.runPromise(
		Effect.gen(function* () {
			const client = yield* makePanelClient(baseUrl, apiKey)
			const highlights = yield* client.feed.highlights({})
			// `Highlight`/`HighlightProject` decode into Schema.Class instances,
			// which RSC can't serialize across the server/client boundary —
			// encode back to a plain object before returning.
			return Schema.encodeSync(HighlightsResponse)(highlights)
		}).pipe(Effect.provide(FetchHttpClient.layer))
	)
}
