import '@/styles/global.css'
import { Analytics } from '@vercel/analytics/react'
import { Agentation } from 'agentation'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Lora } from 'next/font/google'
import Script from 'next/script'
import { SiteHeader } from './components/site-header'
import { SourceLink } from './components/source'
import { Providers } from './providers'

export const metadata: Metadata = {
	title: 'Farrel Darian',
	description: 'Crafting interfaces that abstract complexity',
}

const lora = Lora({ variable: '--font-serif' })
const geist = Geist({ variable: '--font-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang='en' suppressHydrationWarning>
			<body
				className={`${lora.variable} ${geist.variable} ${geistMono.variable} font-serif font-light text-foreground bg-background antialiased`}
			>
				<Providers>
					<main className='min-h-screen p-6'>
						<div className='sm:max-w-lg sm:mx-auto space-y-8'>
							<SiteHeader />

							{children}
						</div>
					</main>

					<footer className='py-5 border-t-[0.5px] border-border'>
						<div className='sm:max-w-lg sm:mx-auto flex justify-center'>
							<SourceLink />
						</div>
					</footer>
					<Analytics />
					{umamiUrl && umamiWebsiteId && (
						<Script
							src={`${umamiUrl}/script.js`}
							data-website-id={umamiWebsiteId}
							strategy='afterInteractive'
						/>
					)}
					{process.env.NODE_ENV === 'development' && <Agentation />}
				</Providers>
			</body>
		</html>
	)
}
