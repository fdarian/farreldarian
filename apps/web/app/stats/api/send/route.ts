const STRIPPED_UPSTREAM_HEADERS = new Set([
	'host',
	'content-length',
	'connection',
	'transfer-encoding',
])

/**
 * Umami's `getIpAddress` ranks `true-client-ip` above `x-forwarded-for` and
 * every other header but the cloud-only `x-umami-client-ip`, so setting it
 * here wins the scan regardless of what the self-hosted instance's own
 * front door already sets.
 */
function resolveClientIp(headers: Headers): string | null {
	const vercelForwardedFor = headers.get('x-vercel-forwarded-for')?.trim()
	if (vercelForwardedFor) return vercelForwardedFor

	const forwardedFor = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
	if (forwardedFor) return forwardedFor

	return null
}

function buildUpstreamHeaders(headers: Headers): Headers {
	const upstreamHeaders = new Headers()
	headers.forEach((value, key) => {
		if (STRIPPED_UPSTREAM_HEADERS.has(key.toLowerCase())) return
		upstreamHeaders.set(key, value)
	})

	const clientIp = resolveClientIp(headers)
	if (clientIp != null) upstreamHeaders.set('true-client-ip', clientIp)

	return upstreamHeaders
}

export async function POST(request: Request): Promise<Response> {
	const umamiUrl = process.env.UMAMI_URL
	if (umamiUrl == null) throw new Error('UMAMI_URL is not set')

	const body = await request.arrayBuffer()
	const upstreamResponse = await fetch(`${umamiUrl}/api/send`, {
		method: 'POST',
		headers: buildUpstreamHeaders(request.headers),
		body,
	})
	const responseBody = await upstreamResponse.arrayBuffer()
	const responseHeaders = new Headers()
	const upstreamContentType = upstreamResponse.headers.get('content-type')
	if (upstreamContentType != null) {
		responseHeaders.set('content-type', upstreamContentType)
	}

	return new Response(responseBody, {
		status: upstreamResponse.status,
		headers: responseHeaders,
	})
}
