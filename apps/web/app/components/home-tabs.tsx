'use client'

import { Tabs } from '@base-ui/react/tabs'
import { type ReactNode, useState } from 'react'

const homeTabValues = ['activity', 'exp', 'talks'] as const
export type HomeTab = (typeof homeTabValues)[number]

/**
 * Controlled (rather than `defaultValue`) so Activity stays selected across client-side nav
 * and HMR — Base UI falls back an uncontrolled root's value to `null` if its tabs
 * transiently unregister, and `defaultValue` only seeds the very first mount.
 */
export function HomeTabs(props: { children: ReactNode }) {
	const [tab, setTab] = useState<HomeTab>('activity')

	return (
		<Tabs.Root
			value={tab}
			onValueChange={(value) => setTab(value as HomeTab)}
			render={<section className='space-y-2 mt-20' />}
		>
			{props.children}
		</Tabs.Root>
	)
}
