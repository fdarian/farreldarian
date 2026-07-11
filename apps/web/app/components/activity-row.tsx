import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import type { ActivityItem } from '@repo/api-contract'
import { RelativeTime } from '@/app/components/relative-time'

/**
 * One row of the Activity feed, with a right-aligned, fixed-width metadata
 * cluster so rows line up. The primary label is the PR title (item.title),
 * linked to the PR (item.externalUrl ?? item.href), with the repo as muted
 * secondary context — same `[pr title] [repo]` format for both Projects and
 * Open Source groups.
 */
export function ActivityRow({ item }: { item: ActivityItem }) {
	return (
		<div className='flex items-center justify-between gap-6 text-sm'>
			<div className='flex items-center gap-3 min-w-0'>
				<a
					href={item.externalUrl ?? item.href}
					target='_blank'
					rel='noopener noreferrer'
					className='min-w-0 truncate border-b border-border text-foreground transition-colors ease-out duration-100 hover:border-foreground'
				>
					{item.title}
				</a>
				<a
					href={`https://github.com/${item.repo}`}
					target='_blank'
					rel='noopener noreferrer'
					className='shrink-0 text-muted-foreground transition-colors hover:text-foreground border-border border-b hover:border-muted-foreground'
				>
					{item.repo}
				</a>
			</div>
			<div className='flex w-28 shrink-0 items-center justify-end gap-1.5 text-xs text-muted-foreground'>
				<span className='shrink-0'>
					<RelativeTime iso={item.updatedAt} />
				</span>
				{item.number !== undefined && (
					<>
						<span aria-hidden className='shrink-0'>
							·
						</span>
						<a
							href={item.externalUrl ?? item.href}
							target='_blank'
							rel='noopener noreferrer'
							className='flex shrink-0 items-center gap-0.5 transition-colors hover:text-foreground border-b border-border hover:border-muted-foreground'
						>
							#{item.number}
						</a>
					</>
				)}
			</div>
		</div>
	)
}
