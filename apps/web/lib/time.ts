const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const MONTH = 30 * DAY
const YEAR = 365 * DAY

/** Formats an ISO timestamp as a short relative time string, e.g. "3d ago". */
export function formatRelativeTime(iso: string): string {
	const elapsedMs = Date.now() - new Date(iso).getTime()

	if (elapsedMs < MINUTE) return 'just now'
	if (elapsedMs < HOUR) return `${Math.round(elapsedMs / MINUTE)}m ago`
	if (elapsedMs < DAY) return `${Math.round(elapsedMs / HOUR)}h ago`
	if (elapsedMs < MONTH) return `${Math.round(elapsedMs / DAY)}d ago`
	if (elapsedMs < YEAR) return `${Math.round(elapsedMs / MONTH)}mo ago`
	return `${Math.round(elapsedMs / YEAR)}y ago`
}
