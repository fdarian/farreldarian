'use client'

import { Tabs } from '@base-ui/react/tabs'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import type { ReactNode } from 'react'

const softwareTabValues = ['projects', 'contributions'] as const
export type SoftwareTab = (typeof softwareTabValues)[number]

const tabParser =
	parseAsStringLiteral(softwareTabValues).withDefault('projects')

/** Controls the Projects/Contributions tab via the `?tab=` search param — shareable and survives refresh/back. */
export function SoftwareTabs({ children }: { children: ReactNode }) {
	const [tab, setTab] = useQueryState('tab', tabParser)

	return (
		<Tabs.Root
			value={tab}
			onValueChange={(value) => setTab(value as SoftwareTab)}
			render={<section className='space-y-4' />}
		>
			{children}
		</Tabs.Root>
	)
}
