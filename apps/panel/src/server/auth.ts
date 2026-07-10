import { apiKey } from '@better-auth/api-key'
import { getRequest } from '@tanstack/react-start/server'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { Config, Context, Effect, Layer, Option, Schema } from 'effect'
import { ALLOWED_EMAIL, isAllowedEmail } from './auth/allowlist.ts'
import { devEmailPlugin } from './auth/dev-email-plugin.ts'
import { AuthGoogle } from './auth/google.ts'
import { baseURLConfig } from './config.ts'
import * as schema from './db/models/auth.ts'
import { Database } from './db/service.ts'

export class Auth extends Context.Service<Auth>()('server/auth', {
	make: Effect.gen(function* () {
		const db = yield* Database
		const google = yield* AuthGoogle
		const secret = Option.getOrUndefined(
			yield* Config.string('BETTER_AUTH_SECRET').pipe(Config.option)
		)
		const baseURL = yield* baseURLConfig
		const isDev = process.env.NODE_ENV === 'development'

		const client = betterAuth({
			secret,
			baseURL,
			database: drizzleAdapter(db.client, {
				provider: 'sqlite',
				schema,
			}),
			socialProviders: { ...google.authOptions },
			databaseHooks: {
				user: {
					create: {
						before: async (user) => {
							if (!isAllowedEmail(user.email)) {
								throw new APIError('FORBIDDEN', {
									message: `Only ${ALLOWED_EMAIL} may sign in to this panel.`,
								})
							}
						},
					},
				},
			},
			plugins: [
				apiKey({
					enableMetadata: true,
					requireName: true,
					defaultPrefix: 'panel_',
					rateLimit: {
						enabled: true,
						timeWindow: 60_000,
						maxRequests: 120,
					},
				}),
				...(isDev ? [devEmailPlugin()] : []),
				// Cookie integration must be last so cookies set by other
				// plugins' `hooks.after` are forwarded to the framework store.
				tanstackStartCookies(),
			],
		})

		return {
			client,
			enabledProviders: { google: google.isEnabled },
			getSession: (headers = getRequest().headers) =>
				Effect.tryPromise({
					try: async () => client.api.getSession({ headers }),
					catch: (cause) =>
						new AuthError({ message: 'Failed to get session', cause }),
				}),
		}
	}),
}) {
	static layer = Layer.effect(Auth, this.make)
}

// `Schema.Defect` is broken in effect@4.0.0-beta.97 (crashes building the AST) —
// `Schema.Unknown` is the workaround until it's fixed upstream.
class AuthError extends Schema.TaggedErrorClass<AuthError>()('AuthError', {
	message: Schema.String,
	cause: Schema.optional(Schema.Unknown),
}) {}
