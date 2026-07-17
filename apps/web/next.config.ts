import type { NextConfig } from 'next/dist/types'

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
	async rewrites() {
		const umamiUrl = process.env.UMAMI_URL
		if (umamiUrl == null) return []
		return [
			{
				source: '/stats/script.js',
				destination: `${umamiUrl}/script.js`,
			},
		]
	},
}

module.exports = config
