import { redirect } from '@tanstack/react-router'
import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { Auth } from '../auth.ts'
import { RuntimeServer } from '../runtime.ts'

export const getUserSession = createServerFn({ method: 'GET' }).handler(
	async () => {
		const session = await Auth.use((auth) => auth.getSession()).pipe(
			RuntimeServer.runPromise
		)
		return session
	}
)

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const session = await getUserSession()
	if (session == null) {
		throw redirect({ to: '/auth/$authView', params: { authView: 'sign-in' } })
	}
	return next({ context: { session } })
})
