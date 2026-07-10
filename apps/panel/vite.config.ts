import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { Config, Effect } from 'effect'
import { nitro } from 'nitro/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

const config = Effect.gen(function* () {
	const port = yield* Config.number('PORT').pipe(Config.withDefault(3000))
	return {
		// Vite's dev SSR module runner re-executes modules through its own loader,
		// which doesn't understand Bun's `bun:*` built-in protocol — externalize it
		// so `drizzle-orm/bun-sqlite` resolves through Bun's native loader instead.
		ssr: { external: ['bun:sqlite'] },
		server: { port },
		plugins: [
			tsConfigPaths(),
			tanstackStart(),
			nitro({ preset: 'bun', serverDir: 'server' }),
			tailwindcss(),
			viteReact(),
		],
	}
})

export default Effect.runSync(config)
