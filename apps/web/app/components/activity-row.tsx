import { ArrowUpRightIcon } from '@phosphor-icons/react/dist/ssr/ArrowUpRight'
import type { ActivityItem } from '@repo/api-contract'
import { formatRelativeTime } from '@/lib/time'
import { cn } from '@/lib/utils'

export type ActivityRowVariant = 'project' | 'open-source'

/**
 * One row of the Activity feed, with a right-aligned, fixed-width metadata
 * cluster so rows line up. The primary label differs by variant:
 * - "project": the repo/project name (per design 53D-1), linked to item.href.
 * - "open-source": the PR title (item.title), linked to the PR
 *   (item.externalUrl ?? item.href), with the repo as muted secondary context.
 */
export function ActivityRow({
	item,
	variant = 'project',
}: {
	item: ActivityItem
	variant?: ActivityRowVariant
}) {
	const isOpenSource = variant === 'open-source'
	const primaryHref = isOpenSource ? (item.externalUrl ?? item.href) : item.href
	const primaryLabel = isOpenSource ? item.title : item.repo
	const secondaryLabel = isOpenSource ? `in ${item.repo}` : item.description

	return (
		<div className='flex items-center gap-3 text-sm'>
			<a
				href={primaryHref}
				target='_blank'
				rel='noopener noreferrer'
				className={cn(
					'border-b border-border text-foreground transition-colors ease-out duration-100 hover:border-foreground',
					isOpenSource ? 'min-w-0 flex-1 truncate' : 'shrink-0'
				)}
			>
				{primaryLabel}
			</a>
			<p
				className={cn(
					'text-muted-foreground',
					isOpenSource ? 'shrink-0' : 'min-w-0 flex-1 truncate'
				)}
			>
				{secondaryLabel}
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
