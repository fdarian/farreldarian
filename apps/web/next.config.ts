import type { NextConfig } from 'next/dist/types'

const config: NextConfig = {
	reactStrictMode: true,
	cacheComponents: true,
	experimental: {
		useTypeScriptCli: true,
	},
}

module.exports = config
