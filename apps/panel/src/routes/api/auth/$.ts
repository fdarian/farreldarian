import { createFileRoute } from '@tanstack/react-router'
import { Effect } from 'effect'
import { Auth } from '#/server/auth.ts'
import { RuntimeServer } from '#/server/runtime.ts'

export const Route = createFileRoute('/api/auth/$')({
	server: {
		handlers: {
			GET: async ({ request }: { request: Request }) =>
				Auth.use((auth) =>
					Effect.promise(() => auth.client.handler(request))
				).pipe(RuntimeServer.runPromise),
			POST: async ({ request }: { request: Request }) =>
				Auth.use((auth) =>
					Effect.promise(() => auth.client.handler(request))
				).pipe(RuntimeServer.runPromise),
		},
	},
})
