import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { Auth } from '#/server/auth.ts'
import { RuntimeServer } from '#/server/runtime.ts'
import { authMiddleware } from './session.functions.ts'

export const listApiKeys = createServerFn({ method: 'GET' })
	.middleware([authMiddleware])
	.handler(() =>
		Auth.use((auth) =>
			Effect.tryPromise(() =>
				auth.client.api.listApiKeys({ headers: getRequest().headers })
			)
		).pipe(RuntimeServer.runPromise)
	)

export const createApiKey = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(S.toStandardSchemaV1(S.Struct({ name: S.String })))
	.handler(({ data }) =>
		Auth.use((auth) =>
			Effect.tryPromise(() =>
				auth.client.api.createApiKey({
					body: { name: data.name },
					headers: getRequest().headers,
				})
			)
		).pipe(RuntimeServer.runPromise)
	)

export const revokeApiKey = createServerFn({ method: 'POST' })
	.middleware([authMiddleware])
	.validator(S.toStandardSchemaV1(S.Struct({ keyId: S.String })))
	.handler(({ data }) =>
		Auth.use((auth) =>
			Effect.tryPromise(() =>
				auth.client.api.deleteApiKey({
					body: { keyId: data.keyId },
					headers: getRequest().headers,
				})
			)
		).pipe(RuntimeServer.runPromise)
	)
