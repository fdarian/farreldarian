'use client'

import posthog from 'posthog-js'
import type { AnchorHTMLAttributes } from 'react'

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
	href: string
	eventName: string
	eventProperties?: Record<string, string | number | boolean>
}

export function TrackedLink({
	href,
	eventName,
	eventProperties,
	onClick,
	...rest
}: Props) {
	function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
		posthog.capture(eventName, eventProperties)
		onClick?.(e)
	}
	return <a href={href} onClick={handleClick} {...rest} />
}
