import { ApiKeyAuth, CurrentApiCaller, Unauthorized } from '@repo/api-contract'
import { Effect, Layer, Redacted } from 'effect'
import { Auth } from '#/server/auth.ts'

function extractBearerKey(redacted: Redacted.Redacted<string>): string {
	const authorization = Redacted.value(redacted)
	return authorization.startsWith('Bearer ')
		? authorization.slice('Bearer '.length)
		: authorization
}

/** Verifies the `Authorization` header against better-auth's api-key store. */
export const ApiKeyAuthLive = Layer.effect(
	ApiKeyAuth,
	Effect.gen(function* () {
		const auth = yield* Auth

		return {
			apiKey: (httpEffect, { credential }) =>
				Effect.gen(function* () {
					const key = extractBearerKey(credential)
					const verified = yield* Effect.tryPromise({
						try: () => auth.client.api.verifyApiKey({ body: { key } }),
						catch: () => new Unauthorized(),
					})
					if (!verified.valid || verified.key == null) {
						return yield* new Unauthorized()
					}

					return yield* httpEffect.pipe(
						Effect.provideService(CurrentApiCaller, {
							userId: verified.key.referenceId,
						})
					)
				}),
		}
	})
)
