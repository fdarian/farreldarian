import { join } from 'node:path'
import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import {
	CurrentSession,
	DevSessions,
	getStickyPort,
	publishRunning,
	runManagedSubprocess,
} from 'devsess'
import { Effect, Schema } from 'effect'
import * as cli from 'effect/cli'

const PANEL_DIR = join(import.meta.dirname, '..')
const INFISICAL_PATH = '/fdariancom/panel'

class InfisicalExportError extends Schema.TaggedError<InfisicalExportError>()(
	'InfisicalExportError',
	{ message: Schema.String }
) {}

const exportedSecrets = Schema.fromJsonString(
	Schema.Array(Schema.Struct({ key: Schema.String, value: Schema.String }))
)

const loadDevEnv = Effect.gen(function* () {
	// Never attach stdout, stderr, or decode errors: they can contain secrets.
	const result = yield* Effect.try({
		try: () =>
			Bun.spawnSync({
				cmd: [
					'infisical',
					'export',
					'--env=dev',
					`--path=${INFISICAL_PATH}`,
					'--format=json',
					'--silent',
				],
				cwd: PANEL_DIR,
				stdout: 'pipe',
				stderr: 'pipe',
			}),
		catch: () =>
			new InfisicalExportError({ message: 'Unable to run infisical export' }),
	})
	if (!result.success)
		return yield* new InfisicalExportError({
			message: `infisical export failed (exit code ${result.exitCode})`,
		})

	const secrets = yield* Schema.decodeUnknownEffect(exportedSecrets)(
		result.stdout.toString()
	).pipe(
		Effect.mapError(
			() =>
				new InfisicalExportError({
					message: 'infisical export returned invalid JSON',
				})
		)
	)
	const infisicalEnv = Object.fromEntries(
		secrets.map((secret) => [secret.key, secret.value])
	)
	// Shell env wins over Infisical.
	return Object.fromEntries(
		Object.entries({ ...infisicalEnv, ...process.env }).filter(
			(entry): entry is [string, string] => entry[1] !== undefined
		)
	)
})

const devCommand = cli.Command.make('dev', {}, () =>
	Effect.gen(function* () {
		const env = yield* loadDevEnv
		const session = yield* CurrentSession

		if (env.DATABASE_URL === undefined) {
			env.DATABASE_URL = yield* session.path('panel.sqlite')
			yield* Effect.logInfo(`[dev] Using session: ${session}`)
		}

		const port = yield* getStickyPort(session)
		env.PORT = String(port)
		env.NITRO_DEV_RUNNER = 'bun-process'
		yield* Effect.logInfo(`[dev] Dev server will run on port ${port}`)

		const vite = runManagedSubprocess('vite', ['dev'], { env })
		const publish = publishRunning({ url: `http://localhost:${port}` })

		return yield* Effect.raceAll([
			vite,
			publish.pipe(Effect.andThen(Effect.never)),
		])
	}).pipe(Effect.provide(CurrentSession.layer))
)

const main = cli.Command.runWith(devCommand, { version: '0.0.1' })
main(process.argv.slice(2)).pipe(
	Effect.provide(DevSessions.layerAt(PANEL_DIR)),
	Effect.provide(BunServices.layer),
	Effect.scoped,
	BunRuntime.runMain
)
