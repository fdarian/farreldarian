import { Config } from 'effect'

export const baseURLConfig = Config.string('BETTER_AUTH_URL').pipe(
	Config.orElse(() =>
		Config.string('PORT').pipe(
			Config.withDefault('3000'),
			Config.map((port) => `http://localhost:${port}`)
		)
	)
)
