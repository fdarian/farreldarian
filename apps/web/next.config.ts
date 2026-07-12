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
}

module.exports = config
