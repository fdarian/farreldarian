import 'server-only'

import { revalidateTag } from 'next/cache'
import { CacheLife, CacheTags } from '@/server/cache'

const BEARER_PREFIX = 'Bearer '

function extractBearerToken(header: string | null): string | null {
	if (header === null || !header.startsWith(BEARER_PREFIX)) return null
	return header.slice(BEARER_PREFIX.length)
}

/**
 * Lets the panel force `getActivity()`/`listProjects()`/`getHighlights()`
 * (`lib/panel.ts`) to refetch instead of waiting out their hour-long
 * `cacheLife` — called once a contributions sync actually lands new rows.
 */
export async function POST(request: Request): Promise<Response> {
	const secret = process.env.REVALIDATE_SECRET
	const token = extractBearerToken(request.headers.get('Authorization'))

	if (!secret || token !== secret) {
		return Response.json({ error: 'Unauthorized' }, { status: 401 })
	}

	// The profile must match the `cacheLife` profile passed alongside
	// `cacheTag` in `lib/panel.ts` — Next's Cache Components API ties
	// revalidation to that profile, not just the tag.
	revalidateTag(CacheTags.activity, CacheLife.common)
	revalidateTag(CacheTags.projects, CacheLife.common)
	revalidateTag(CacheTags.highlight, CacheLife.common)

	return Response.json({ revalidated: true })
}
