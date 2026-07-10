'use client'

import { CaretDoubleRightIcon } from '@phosphor-icons/react/dist/ssr/CaretDoubleRight'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

const crumbs = [
	{ label: 'Farrel Darian', href: '/' },
	{ label: 'Software', href: '/software' },
] as const

/** Two-level breadcrumb (Farrel Darian › Software) — whichever crumb matches the current route is shown active. */
export function SiteHeader() {
	const pathname = usePathname()

	return (
		<div className='space-y-2'>
			<div className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					{crumbs.map((crumb) => {
						const isActive = pathname === crumb.href
						return (
							<Link
								key={crumb.href}
								href={crumb.href}
								className={cn(
									'flex items-center gap-1 text-sm transition-colors hover:text-foreground',
									isActive
										? 'font-medium text-foreground'
										: 'text-muted-foreground'
								)}
							>
								{isActive && (
									<CaretDoubleRightIcon size={12} className='text-orange-500' />
								)}
								{crumb.label}
							</Link>
						)
					})}
				</div>

				<ThemeToggle />
			</div>
			<div className='h-[0.5px] w-full bg-border' />
		</div>
	)
}
