import 'server-only'

import type { ActivityResponse } from '@repo/api-contract'
import {
	PanelApi,
	ProjectsQuery,
	type ProjectsResponse,
} from '@repo/api-contract'
import { Effect, type Schema } from 'effect'
import {
	FetchHttpClient,
	HttpClient,
	HttpClientRequest,
} from 'effect/unstable/http'
import { HttpApiClient } from 'effect/unstable/httpapi'

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

export function getActivity(): Promise<ActivityResponse> {
	const { baseUrl, apiKey } = panelCredentials()
	return Effect.runPromise(
		Effect.gen(function* () {
			const client = yield* makePanelClient(baseUrl, apiKey)
			return yield* client.feed.activity({})
		}).pipe(Effect.provide(FetchHttpClient.layer))
	)
}

export function listProjects(
	query?: ConstructorParameters<typeof ProjectsQuery>[0]
): Promise<Schema.Schema.Type<typeof ProjectsResponse>> {
	const { baseUrl, apiKey } = panelCredentials()
	return Effect.runPromise(
		Effect.gen(function* () {
			const client = yield* makePanelClient(baseUrl, apiKey)
			// `ProjectsQuery` is a Class schema — encoding it for the request
			// requires an actual class instance, not a plain object, so we
			// construct one here rather than pushing that onto callers.
			return yield* client.feed.projects({
				query: new ProjectsQuery(query ?? {}),
			})
		}).pipe(Effect.provide(FetchHttpClient.layer))
	)
}
