import '@styles/global.css'
import { CaretDoubleRightIcon } from '@phosphor-icons/react/dist/ssr/CaretDoubleRight'
import { Analytics } from '@vercel/analytics/react'
import type { Metadata } from 'next'
import { Lora } from 'next/font/google'
import { Nav } from './components/nav'
import { ThemeToggle } from './components/theme-toggle'
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

function NavBar() {
  return (
    <div className='space-y-2'>
      <div className='flex justify-between'>
        <div className='space-y-1'>
          <Nav className='flex items-center gap-1'>
            <CaretDoubleRightIcon size={12} className='text-orange-500' />
            Bio
          </Nav>
        </div>

        <div className='self-end flex items-center gap-2'>
          <ThemeToggle />
        </div>
      </div>
      <div className='w-full h-[0.5px] bg-border' />
    </div>
  )
}
