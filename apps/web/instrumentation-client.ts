import posthog from 'posthog-js'
import { POSTHOG_PROXY_PATH, POSTHOG_UI_HOST } from '@/lib/posthog'

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
if (key) {
	posthog.init(key, {
		api_host: POSTHOG_PROXY_PATH,
		ui_host: POSTHOG_UI_HOST,
		capture_pageview: 'history_change',
		autocapture: true,
		capture_exceptions: true,
		session_recording: {
			maskAllInputs: true,
		},
		debug: process.env.NODE_ENV === 'development',
	})
}
