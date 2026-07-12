import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { Config, Effect } from 'effect'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

const config = Effect.gen(function* () {
	const port = yield* Config.number('PORT').pipe(Config.withDefault(3000))
	return defineConfig({
		server: { port },
		resolve: { tsconfigPaths: true },
		plugins: [
			tanstackStart(),
			// `devServer.runner: 'bun-process'` is required — nitro's dev server
			// defaults to a Node worker for *any* preset, so `drizzle-orm/bun-sqlite`
			// (→ the `bun:sqlite` builtin) fails to load under `vite dev` otherwise,
			// even though the preset itself is `bun`. Same `NITRO_DEV_RUNNER=bun-process`
			// env var set on the `dev` script in package.json, kept here too in case
			// `vite dev` is invoked directly.
			nitro({
				preset: 'bun',
				serverDir: 'server',
				devServer: { runner: 'bun-process' },
			}),
			tailwindcss(),
			viteReact(),
		],
	})
})

export default Effect.runSync(config)
