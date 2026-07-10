import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import type { ActivityItem } from '@repo/api-contract'
import { formatRelativeTime } from '@/lib/time'

/** One row of the Activity feed (own project or open-source contribution): repo link, description, and a right-aligned, fixed-width metadata cluster so rows line up. */
export function ActivityRow({ item }: { item: ActivityItem }) {
	return (
		<div className='flex items-center gap-3 text-sm'>
			<a
				href={item.href}
				target='_blank'
				rel='noopener noreferrer'
				className='shrink-0 border-b border-border text-foreground transition-colors ease-out duration-100 hover:border-foreground'
			>
				{item.repo}
			</a>
			<p className='min-w-0 flex-1 truncate text-muted-foreground'>
				{item.description}
			</p>
			<div className='flex w-28 shrink-0 items-center justify-end gap-1.5 text-xs text-muted-foreground'>
				<span className='shrink-0'>{formatRelativeTime(item.updatedAt)}</span>
				{item.number !== undefined && (
					<>
						<span aria-hidden className='shrink-0'>
							·
						</span>
						<a
							href={item.externalUrl ?? item.href}
							target='_blank'
							rel='noopener noreferrer'
							className='flex shrink-0 items-center gap-0.5 transition-colors hover:text-foreground'
						>
							#{item.number}
							<ArrowUpRightIcon size={12} />
						</a>
					</>
				)}
			</div>
		</div>
	)
}
