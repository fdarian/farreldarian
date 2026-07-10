import type { GoogleOptions } from 'better-auth'
import { Config, Context, Effect, Layer } from 'effect'
import { shorten } from '#/lib/strings/shorten.ts'

/** Google social sign-in, enabled only when AUTH_GOOGLE_ID/SECRET resolve. */
export class AuthGoogle extends Context.Service<AuthGoogle>()('auth/Google', {
	make: Effect.gen(function* () {
		const authOptions = yield* Effect.all({
			clientId: Config.string('AUTH_GOOGLE_ID'),
			clientSecret: Config.string('AUTH_GOOGLE_SECRET'),
		}).pipe(
			Effect.map((google) => ({ google }) satisfies { google: GoogleOptions }),
			Effect.orElseSucceed(() => ({}))
		)

		const isEnabled = 'google' in authOptions

		if (isEnabled) {
			yield* Effect.logInfo(
				`[AuthGoogle] connected to clientId: ${shorten(authOptions.google.clientId)}`
			)
		}

		return { authOptions, isEnabled }
	}),
}) {
	static layer = Layer.effect(AuthGoogle, this.make)
}
