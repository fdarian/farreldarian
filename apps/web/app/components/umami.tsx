import Script from 'next/script'

const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

export function Umami() {
	if (umamiWebsiteId == null) return null
	return (
		<Script
			src='/stats/script.js'
			data-website-id={umamiWebsiteId}
			strategy='afterInteractive'
		/>
	)
}
