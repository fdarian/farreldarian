import { createFileRoute } from '@tanstack/react-router'
import { handler } from '#/server/api/web-handler.ts'

export const Route = createFileRoute('/api/v1/$')({
	server: {
		handlers: {
			GET: ({ request }: { request: Request }) => handler(request),
			POST: ({ request }: { request: Request }) => handler(request),
			PATCH: ({ request }: { request: Request }) => handler(request),
			DELETE: ({ request }: { request: Request }) => handler(request),
		},
	},
})
