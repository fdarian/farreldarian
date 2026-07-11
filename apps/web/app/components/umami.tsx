import Script from 'next/script'

const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

export function Umami() {
	if (umamiUrl == null || umamiWebsiteId == null) return null
	return (
		<Script
			src={`${umamiUrl}/script.js`}
			data-website-id={umamiWebsiteId}
			strategy='afterInteractive'
		/>
	)
}
