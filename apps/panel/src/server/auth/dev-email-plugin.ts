import { APIError, createAuthEndpoint } from 'better-auth/api'
import { setSessionCookie } from 'better-auth/cookies'
import * as S from 'effect/Schema'
import { getName } from '#/lib/effect/schemas/email.ts'
import { isAllowedEmail } from './allowlist.ts'
import { DevEmailInput } from './schemas.ts'

/** Dev-only passwordless sign-in: posts an allowlisted email, gets a session back. */
export function devEmailPlugin() {
	return {
		id: 'dev-email',
		endpoints: {
			devEmailSignIn: createAuthEndpoint(
				'/sign-in/email-only',
				{
					method: 'POST',
					body: S.toStandardSchemaV1(DevEmailInput),
				},
				async (ctx) => {
					const email = ctx.body.email

					if (!isAllowedEmail(email)) {
						throw new APIError('BAD_REQUEST', {
							message: 'Email is not allowed to sign in.',
						})
					}

					const existing =
						await ctx.context.internalAdapter.findUserByEmail(email)
					const user = existing
						? existing.user
						: await ctx.context.internalAdapter.createUser({
								email,
								name: getName(email),
							})

					const session = await ctx.context.internalAdapter.createSession(
						user.id
					)

					if (!session) {
						throw new APIError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create session.',
						})
					}

					await setSessionCookie(ctx, { session, user })

					return ctx.json({ success: true })
				}
			),
		},
	} as const
}
