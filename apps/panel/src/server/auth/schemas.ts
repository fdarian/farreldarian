import * as S from 'effect/Schema'
import { Email } from '#/lib/effect/schemas/email.ts'
import { ALLOWED_EMAIL, isAllowedEmail } from './allowlist.ts'

export const DevEmailInput = S.Struct({
	email: Email.check(
		S.makeFilter((email) =>
			isAllowedEmail(email) ? undefined : `Must be ${ALLOWED_EMAIL}`
		)
	),
})
