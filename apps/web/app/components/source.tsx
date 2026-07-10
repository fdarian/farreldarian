'use client'

import { usePathname } from 'next/navigation'

function getPath(pathname: string) {
	switch (pathname) {
		case '/':
			return '/blob/main/apps/web/app/page.tsx'
		case '/software':
			return '/blob/main/apps/web/app/software/page.tsx'
		default:
			return ''
	}
}

export function SourceLink() {
	const path = usePathname()
	return (
		<a
			className='border-b border-border hover:border-foreground transition-colors ease-out duration-100 text-sm'
			target='_blank'
			rel='noopener noreferrer'
			href={`https://github.com/fdarian/farreldarian${getPath(path)}`}
		>
			Source
		</a>
	)
}
