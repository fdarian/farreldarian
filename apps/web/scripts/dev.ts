import { join } from 'node:path'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import { loadEnvConfig } from '@next/env'
import {
	awaitRunning,
	CurrentSession,
	DevSessions,
	getStickyPort,
	runManagedSubprocess,
} from 'devsess'
import { Effect, Schema } from 'effect'
import * as cli from 'effect/cli'

const WEB_DIR = join(import.meta.dirname, '..')

class DevConfigError extends Schema.TaggedError<DevConfigError>()(
	'DevConfigError',
	{ message: Schema.String }
) {}

class EnvLoadError extends Schema.TaggedError<EnvLoadError>()('EnvLoadError', {
	cause: Schema.Defect(),
}) {}

const local = cli.Flag.String('local').pipe(cli.Flag.atLeast(0))

const devCommand = cli.Command.make('dev', { local }, (options) =>
	Effect.gen(function* () {
		// Next only loads `.env*` inside its own process, so load them the same way
		// here to see keys that are defined there but not in the shell.
		const loaded = yield* Effect.try({
			try: () => loadEnvConfig(WEB_DIR, true),
			catch: (cause) => new EnvLoadError({ cause }),
		})
		const env = Object.fromEntries(
			Object.entries(loaded.combinedEnv).filter(
				(entry): entry is [string, string] => entry[1] !== undefined
			)
		)

		for (const name of options.local) {
			if (name !== 'panel')
				return yield* new DevConfigError({
					message: `Unknown --local target "${name}". Only "panel" is supported.`,
				})
			const panel = yield* awaitRunning<{ url: string }>('../panel')
			env.PANEL_API_URL = panel.url
		}

		if (!env.PANEL_API_URL)
			return yield* new DevConfigError({
				message:
					'PANEL_API_URL must be set (shell env or apps/web/.env), or pass --local panel.',
			})

		const session = yield* CurrentSession
		const port = yield* getStickyPort(session)
		env.PORT = String(port)
		yield* Effect.logInfo(`[dev] Dev server will run on port ${port}`)

		return yield* runManagedSubprocess(
			'next',
			['dev', '--port', String(port)],
			{
				env,
			}
		)
	}).pipe(Effect.provide(CurrentSession.layer))
)

const main = cli.Command.runWith(devCommand, { version: '0.0.1' })
main(process.argv.slice(2)).pipe(
	Effect.provide(DevSessions.layerAt(WEB_DIR)),
	Effect.provide(BunServices.layer),
	Effect.scoped,
	BunRuntime.runMain
)
