import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import type { NextConfig } from 'next/dist/types'
import { POSTHOG_PROXY_PATH } from './lib/posthog'

const require = createRequire(import.meta.url)
const nextPackagePath = realpathSync(require.resolve('next/package.json'))
const repoRoot = realpathSync(resolve(import.meta.dirname, '../..'))

const commonAncestor = (directory: string, path: string): string => {
	const offset = relative(directory, path)
	if (offset !== '..' && !offset.startsWith(`..${sep}`) && !isAbsolute(offset))
		return directory
	return commonAncestor(dirname(directory), path)
}

const config: NextConfig = {
	turbopack: {
		/** Turbopack can't resolve next in pnpm's global store outside its root. Remove after https://github.com/vercel/next.js/pull/98003 ships and Next is upgraded. */
		root: commonAncestor(repoRoot, nextPackagePath),
	},
	reactStrictMode: true,
	cacheComponents: true,
	cacheLife: {
		common: {
			stale: 60,
			revalidate: 30,
			expire: 31_556_952,
		},
	},
	partialPrefetching: true,
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
