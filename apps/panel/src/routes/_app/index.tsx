import { createFileRoute, Link } from '@tanstack/react-router'
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
			<nav className='flex items-center gap-4 text-sm'>
				<Link to='/repos' className='underline underline-offset-4'>
					Repos
				</Link>
				<Link to='/contributions' className='underline underline-offset-4'>
					Contributions
				</Link>
				<Link to='/tags' className='underline underline-offset-4'>
					Tags
				</Link>
				<Link to='/api-keys' className='underline underline-offset-4'>
					API keys
				</Link>
				<a href='/api/v1/docs' className='underline underline-offset-4'>
					API docs
				</a>
			</nav>
			<Button variant='outline' onClick={() => authClient.signOut()}>
				Sign out
			</Button>
		</div>
	)
}
