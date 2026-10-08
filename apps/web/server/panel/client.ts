import { PanelApi } from '@repo/api-contract'
import { Config, Context, Effect, Layer } from 'effect'
import { HttpClient, HttpClientRequest } from 'effect/http'
import { HttpApiClient } from 'effect/http-api'

export class Panel extends Context.Service<Panel>()('Panel', {
	make: Effect.gen(function* () {
		const baseUrl = yield* Config.String('PANEL_API_URL')
		const apiKey = yield* Config.String('PANEL_API_KEY')

		const client = yield* HttpApiClient.make(PanelApi, {
			baseUrl,
			transformClient: HttpClient.mapRequest(
				HttpClientRequest.setHeader('Authorization', apiKey)
			),
		})
		return client
	}),
}) {
	static layer = Layer.effect(Panel, this.make)
}
