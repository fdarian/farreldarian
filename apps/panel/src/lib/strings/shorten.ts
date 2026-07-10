/** Truncates a secret-ish string for safe logging, e.g. `"abcd1234…wxyz"`. */
export function shorten(value: string, visible = 4): string {
	if (value.length <= visible * 2) return value
	return `${value.slice(0, visible)}…${value.slice(-visible)}`
}
