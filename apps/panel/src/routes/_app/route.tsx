import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getUserSession } from '#/server/auth/session.functions.ts'

export const Route = createFileRoute('/_app')({
	beforeLoad: async () => {
		const session = await getUserSession()
		if (session == null) {
			throw redirect({ to: '/auth/$authView', params: { authView: 'sign-in' } })
		}
		return { session }
	},
	component: () => <Outlet />,
})
