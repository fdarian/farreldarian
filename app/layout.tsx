import '@styles/global.css'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import { NavBar } from './components/navbar'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Farrel Darian',
  description: 'Crafting interfaces that abstract complexity',
}

const lora = Lora({ variable: '--font-serif' })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${lora.variable} font-serif font-light text-foreground bg-background antialiased`}
      >
        <Providers>
          <main className='min-h-screen p-6'>
            <div className='sm:max-w-lg sm:mx-auto space-y-8'>
              <NavBar />

              {children}
            </div>
          </main>
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}

