import type { NextConfig } from 'next/dist/types'
import { POSTHOG_PROXY_PATH } from './lib/posthog'

const config: NextConfig = {
	reactStrictMode: true,
	cacheComponents: true,
	cacheLife: {
		common: {
			stale: 60,
			revalidate: 30,
			expire: 31_556_952,
		},
	},
	experimental: {
		useTypeScriptCli: true,
	},
	// posthog-js posts events to a trailing-slash path (`/e/`). Next's default
	// trailing-slash redirect runs before `beforeFiles` rewrites and would
	// strip that slash before the rewrite below ever sees the request.
	skipTrailingSlashRedirect: true,
	async rewrites() {
		return {
			beforeFiles: [
				// Session replay's recorder bundle and other lazy-loaded scripts
				// (posthog-js loads them as `/static/<name>.js`)
				{
					source: `${POSTHOG_PROXY_PATH}/static/:path*`,
					destination: 'https://us-assets.i.posthog.com/static/:path*',
				},
				// Remote config / feature-flag bootstrap bundle, also served off
				// the assets host but outside `/static/`
				{
					source: `${POSTHOG_PROXY_PATH}/array/:path*`,
					destination: 'https://us-assets.i.posthog.com/array/:path*',
				},
				// Everything else: event capture, flags, session recording ingestion
				{
					source: `${POSTHOG_PROXY_PATH}/:path*`,
					destination: 'https://us.i.posthog.com/:path*',
				},
			],
		}
	},
}

module.exports = config
