import '@styles/global.css'
import { Analytics } from '@vercel/analytics/react'
import { Assistant } from 'next/font/google'

export const metadata = {
  title: 'Farrel Darian',
  description: 'Crafting interfaces that abstract complexity',
}

const assistant = Assistant({ variable: '--font-sans', subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body
        className={`${assistant.variable} font-sans text-zinc-950 bg-zinc-50`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  )
}

function _getCurrentYear() {
  return new Date().getFullYear()
}
