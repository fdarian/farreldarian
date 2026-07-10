import { createFileRoute } from '@tanstack/react-router'
import { authClient } from '#/client/auth.ts'
import { Button } from '#/components/ui/button.tsx'

export const Route = createFileRoute('/_app/')({
	component: Dashboard,
})

function Dashboard() {
	const { session } = Route.useRouteContext()

	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-4 p-4'>
			<p className='text-muted-foreground text-sm'>
				Signed in as {session.user.email}
			</p>
			<p className='text-muted-foreground text-sm'>
				GitHub-backed activity/projects domain lands in a follow-up.
			</p>
			<Button variant='outline' onClick={() => authClient.signOut()}>
				Sign out
			</Button>
		</div>
	)
}
