import '@/styles/global.css'
import { Agentation } from 'agentation'
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Lora } from 'next/font/google'
import { SiteHeader } from './components/site-header'
import { Umami } from './components/umami'
import { Providers } from './providers'

export const metadata: Metadata = {
	title: 'Farrel Darian',
	description: 'Crafting interfaces that abstract complexity',
}

const lora = Lora({ variable: '--font-serif' })
const geist = Geist({ variable: '--font-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] })

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
					<main className='min-h-screen px-5'>
						<div className='sm:max-w-2xl sm:mx-auto'>
							<SiteHeader />

							{children}
						</div>
					</main>
					<Umami />
					{process.env.NODE_ENV === 'development' && <Agentation />}
				</Providers>
			</body>
		</html>
	)
}
