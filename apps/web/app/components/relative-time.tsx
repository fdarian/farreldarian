'use client'

import { useEffect, useState } from 'react'
import { formatRelativeTime } from '@/lib/time'

/**
 * Renders a relative time string (e.g. "3d ago") computed on the client, so
 * the cached server shell stays deterministic — `Date.now()` never runs
 * during prerender. Shows the absolute date until mounted.
 */
export function RelativeTime({ iso }: { iso: string }) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<>
			{mounted ? formatRelativeTime(iso) : new Date(iso).toLocaleDateString()}
		</>
	)
}
