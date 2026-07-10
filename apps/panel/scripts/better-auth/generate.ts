import * as BunRuntime from '@effect/platform-bun/BunRuntime'
import * as BunServices from '@effect/platform-bun/BunServices'
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import * as Stream from 'effect/Stream'
import { ChildProcess, ChildProcessSpawner } from 'effect/unstable/process'

class CommandExecutionError extends S.TaggedErrorClass<CommandExecutionError>()(
	'CommandExecutionError',
	{
		exitCode: S.Number,
		stderr: S.String,
	}
) {}

function run(command: ChildProcess.Command) {
	return Effect.gen(function* () {
		const spawner = yield* ChildProcessSpawner.ChildProcessSpawner

		return yield* Effect.scoped(
			Effect.gen(function* () {
				const handle = yield* spawner.spawn(command)

				const [exitCode, stdout, stderr] = yield* Effect.all(
					[
						handle.exitCode,
						Stream.decodeText(handle.stdout).pipe(
							Stream.tap((chunk) =>
								Effect.sync(() => process.stdout.write(chunk))
							),
							Stream.runFold(
								() => '',
								(a, b) => a + b
							)
						),
						Stream.decodeText(handle.stderr).pipe(
							Stream.runFold(
								() => '',
								(a, b) => a + b
							)
						),
					],
					{ concurrency: 3 }
				)

				if (exitCode !== 0) {
					return yield* new CommandExecutionError({ exitCode, stderr })
				}

				return stdout
			})
		)
	})
}

const TARGET = 'src/server/db/models/auth.ts'

Effect.gen(function* () {
	yield* run(
		ChildProcess.make('bunx', [
			'auth',
			'generate',
			'-y',
			'--config',
			'entries/better-auth',
		])
	)
	yield* run(ChildProcess.make('mv', ['auth-schema.ts', TARGET]))

	yield* run(
		ChildProcess.make('bunx', [
			'@getgrit/cli',
			'apply',
			'scripts/better-auth/auth-schema.grit',
			TARGET,
			'--force',
		])
	)

	yield* run(
		ChildProcess.make('bunx', ['@biomejs/biome', 'check', '--write', TARGET])
	)
}).pipe(Effect.provide(BunServices.layer), BunRuntime.runMain)
