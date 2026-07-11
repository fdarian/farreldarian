'use client'

import { Tabs } from '@base-ui/react/tabs'
import { PushPinIcon } from '@phosphor-icons/react/ssr'
import { useState } from 'react'

const highlightTabs = [
	{
		value: 'agent',
		label: 'tool for agent',
		items: [
			{
				name: 'rskills',
				description: 'Read any skills without installing them',
			},
			{
				name: 'furl',
				description: 'curl replacement to fetch web pages in markdown',
			},
			{
				name: 'furl',
				description: 'curl replacement to fetch web pages in markdown',
			},
		],
	},
	{
		value: 'devtool',
		label: 'devtool',
		items: [
			{
				name: 'otheme',
				description: 'opinionated theme for your terminal and editor',
			},
			{
				name: 'dotfiles',
				description: 'my personal development environment setup',
			},
		],
	},
]

export function HighlightsCard() {
	const [tab, setTab] = useState<string>('agent')

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
					{highlightTabs.map((highlight) => (
						<Tabs.Tab
							key={highlight.value}
							value={highlight.value}
							className='-mb-px cursor-pointer rounded-t-[5px] border border-b-0 border-transparent px-2 py-1 text-muted-foreground transition-colors data-active:border-border-muted data-active:bg-elevated data-active:font-medium data-active:text-foreground'
						>
							{highlight.label}
						</Tabs.Tab>
					))}
				</Tabs.List>
			</div>
			{highlightTabs.map((highlight) => (
				<Tabs.Panel
					key={highlight.value}
					value={highlight.value}
					className='space-y-2 rounded-[5px] border border-border-muted bg-elevated px-3 py-2'
				>
					{highlight.items.map((item, index) => (
						<HighlightRow
							// biome-ignore lint/suspicious/noArrayIndexKey: hardcoded static list, order never changes
							key={index}
							name={item.name}
							description={item.description}
						/>
					))}
				</Tabs.Panel>
			))}
		</Tabs.Root>
	)
}

function HighlightRow(props: { name: string; description: string }) {
	return (
		<div className='flex items-center gap-4 text-sm'>
			<span className='shrink-0 border-b border-border'>{props.name}</span>
			<span className='text-muted-foreground'>{props.description}</span>
		</div>
	)
}
