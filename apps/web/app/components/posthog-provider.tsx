'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { POSTHOG_PROXY_PATH, POSTHOG_UI_HOST } from '@/lib/posthog'

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY

export function PostHogProvider() {
	useEffect(() => {
		if (posthogKey == null) return
		if (posthog.__loaded) return

		posthog.init(posthogKey, {
			// Same-origin, reverse-proxied via next.config.ts so ad blockers
			// don't block ingestion
			api_host: POSTHOG_PROXY_PATH,
			// api_host is a same-origin path, not a posthog.com host, so it can't
			// be derived from it — set explicitly for toolbar "open in PostHog" links
			ui_host: POSTHOG_UI_HOST,
			// App Router navigations are history-API pushState/replaceState, not
			// full page loads — this makes posthog-js emit a $pageview on those too
			capture_pageview: 'history_change',
			autocapture: true,
			// Session replay is on (library default). Input values default to
			// unmasked except <input type="password">, so mask every input
			// field's value explicitly rather than trust that default.
			session_recording: {
				maskAllInputs: true,
			},
		})
	}, [])

	return null
}
