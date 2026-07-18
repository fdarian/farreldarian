'use client'

import { Tabs } from '@base-ui/react/tabs'
import posthog from 'posthog-js'
import { type ReactNode, useState } from 'react'
import { HomeTab } from './home-tabs-value'

/**
 * Controlled (rather than `defaultValue`) so Activity stays selected across client-side nav
 * and HMR — Base UI falls back an uncontrolled root's value to `null` if its tabs
 * transiently unregister, and `defaultValue` only seeds the very first mount.
 */
export function HomeTabs(props: { children: ReactNode }) {
	const [tab, setTab] = useState<HomeTab>(HomeTab.Projects)

	return (
		<Tabs.Root
			value={tab}
			onValueChange={(value) => {
				setTab(value as HomeTab)
				posthog.capture('home_tab_changed', { tab: value })
			}}
			render={<section className='space-y-2 mt-20' />}
		>
			{props.children}
		</Tabs.Root>
	)
}
