import { Schema } from 'effect'

const emailRegex = /^[^@]+@[^@]+\.[^@]+$/

// `Schema.filter` (v3) is now `.check(Schema.makeFilter(...))` in v4 — the
// filter returns `undefined` on success, a message on failure (inverted polarity).
export const Email = Schema.String.check(
	Schema.makeFilter((s: string) =>
		emailRegex.test(s) ? undefined : 'must be a valid email'
	)
).pipe(Schema.brand('Email'))

export type Email = typeof Email.Type

export function getName(email: Email) {
	const name = email.split('@')[0]
	if (name == null) throw new Error(`Malformed 'Email' type: ${email}`)
	return name
}
