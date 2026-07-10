/** Only this email may sign in — the panel is single-user (Farrel only). */
export const ALLOWED_EMAIL = 'farreldarian@icloud.com'

export function isAllowedEmail(email: string): boolean {
	return email.toLowerCase() === ALLOWED_EMAIL
}
