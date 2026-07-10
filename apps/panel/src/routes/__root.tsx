import {
	createRootRoute,
	HeadContent,
	Outlet,
	Scripts,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '../globals.css?url'

function NotFoundComponent() {
	return (
		<div className='flex min-h-screen items-center justify-center'>
			<div className='text-center'>
				<h1 className='mb-4 font-bold text-4xl'>404</h1>
				<p className='text-lg text-muted-foreground'>Not Found</p>
			</div>
		</div>
	)
}

export const Route = createRootRoute({
	head: () => ({
		links: [{ rel: 'stylesheet', href: appCss }],
	}),
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
})

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	)
}

function RootDocument(props: { children: ReactNode }) {
	return (
		<html lang='en' suppressHydrationWarning>
			<head>
				<HeadContent />
				<meta charSet='utf-8' />
				<meta name='viewport' content='width=device-width, initial-scale=1' />
				<link rel='preconnect' href='https://fonts.googleapis.com' />
				<link
					rel='preconnect'
					href='https://fonts.gstatic.com'
					crossOrigin=''
				/>
				<link
					href='https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap'
					rel='stylesheet'
				/>
			</head>
			<body>
				{props.children}
				<Scripts />
			</body>
		</html>
	)
}
