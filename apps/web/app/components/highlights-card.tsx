'use client'

import { Tabs } from '@base-ui/react/tabs'
import { ClockClockwiseIcon, PushPinIcon } from '@phosphor-icons/react/ssr'
import type { Highlight, HighlightProject } from '@repo/api-contract'
import { useState } from 'react'
import { RelativeTime } from '@/app/components/relative-time'

export function HighlightsCard(props: { highlights: readonly Highlight[] }) {
	const firstHighlight = props.highlights[0]
	const [tab, setTab] = useState<string | undefined>(firstHighlight?.tag)

	if (!firstHighlight) return null

	return (
		<Tabs.Root
			value={tab}
			onValueChange={(value) => setTab(value as string)}
			render={
				<div className='rounded-[8px] border-[0.5px] border-border-subtle bg-surface p-0.75 -mx-1' />
			}
		>
			<div className='flex items-end justify-between gap-2 px-3'>
				<div className='flex items-center gap-1.5 pt-1 pb-1.75'>
					<PushPinIcon className='size-3 shrink-0 text-accent' />
					<p className='text-xs font-medium text-muted-foreground'>
						Highlights
					</p>
				</div>
				<Tabs.List className='relative z-10 flex text-xs'>
					{props.highlights.map((highlight) => (
						<Tabs.Tab
							key={highlight.tag}
							value={highlight.tag}
							className='-mb-px cursor-pointer rounded-t-[5px] border border-b-0 border-transparent px-2 py-1 text-muted-foreground transition-colors data-active:border-border-muted data-active:bg-elevated data-active:font-medium data-active:text-foreground'
						>
							{highlight.tag}
						</Tabs.Tab>
					))}
				</Tabs.List>
			</div>
			{props.highlights.map((highlight) => (
				<Tabs.Panel
					key={highlight.tag}
					value={highlight.tag}
					className='space-y-2 rounded-[5px] border border-border-muted bg-elevated px-3 py-2'
				>
					{highlight.description && (
						<p className='text-xs text-muted-foreground'>
							{highlight.description}
						</p>
					)}
					{highlight.projects.map((project) => (
						<HighlightRow key={project.href} project={project} />
					))}
				</Tabs.Panel>
			))}
		</Tabs.Root>
	)
}

function HighlightRow(props: { project: HighlightProject }) {
	return (
		<div className='flex items-center gap-4 text-sm'>
			<a
				target='_blank'
				rel='noopener noreferrer'
				href={props.project.href}
				className='shrink-0 border-b border-border transition-colors ease-out duration-100 hover:border-foreground'
			>
				{props.project.name}
			</a>
			<span className='min-w-0 flex-1 truncate text-muted-foreground'>
				{props.project.description}
			</span>
			{props.project.pushedAt !== undefined && (
				<span className='flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground'>
					<ClockClockwiseIcon size={10} />
					<RelativeTime iso={props.project.pushedAt} />
				</span>
			)}
		</div>
	)
}
