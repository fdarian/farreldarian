// Same-origin path PostHog is reverse-proxied through (see next.config.ts).
// Deliberately not PostHog's documented `/ingest` — that literal string is in
// ad-blocker filter lists, which would defeat the point of proxying.
export const POSTHOG_PROXY_PATH = '/api/stats'

// PostHog's real UI origin (US cloud), for toolbar "open in PostHog" links.
// Not derivable from POSTHOG_PROXY_PATH since it's a same-origin path, not a
// posthog.com host.
export const POSTHOG_UI_HOST = 'https://us.posthog.com'
