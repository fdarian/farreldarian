import { getRequest } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { Auth } from '#/server/auth.ts'
import { protectedServerFn } from '#/server/server-fn.ts'

export const listApiKeys = protectedServerFn({ method: 'GET' }).effect(() =>
	Auth.use((auth) =>
		Effect.tryPromise(() =>
			auth.client.api.listApiKeys({ headers: getRequest().headers })
		)
	)
)

export const createApiKey = protectedServerFn({ method: 'POST' })
	.validator(S.toStandardSchemaV1(S.Struct({ name: S.String })))
	.effect(({ data }) =>
		Auth.use((auth) =>
			Effect.tryPromise(() =>
				auth.client.api.createApiKey({
					body: { name: data.name },
					headers: getRequest().headers,
				})
			)
		)
	)

export const revokeApiKey = protectedServerFn({ method: 'POST' })
	.validator(S.toStandardSchemaV1(S.Struct({ keyId: S.String })))
	.effect(({ data }) =>
		Auth.use((auth) =>
			Effect.tryPromise(() =>
				auth.client.api.deleteApiKey({
					body: { keyId: data.keyId },
					headers: getRequest().headers,
				})
			)
		)
	)
