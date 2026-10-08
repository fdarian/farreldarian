import { Config } from 'effect'

export const baseURLConfig = Config.String('BETTER_AUTH_URL').pipe(
	Config.orElse(() =>
		Config.String('PORT').pipe(
			Config.withDefault('3000'),
			Config.map((port) => `http://localhost:${port}`)
		)
	)
)
