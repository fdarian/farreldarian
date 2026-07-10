'use client'

import { CaretDoubleRightIcon } from '@phosphor-icons/react/dist/ssr/CaretDoubleRight'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from 'utils/class'
import { Nav } from './nav'
import { ThemeToggle } from './theme-toggle'

export function NavBar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Music', href: '/music' },
    { label: 'Curiousity', href: '/curiousity' },
    { label: 'Bio', href: '/' },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className='space-y-2'>
      <div className='flex justify-between'>
        <div className='space-y-1'>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Nav
                className='flex items-center gap-1'
                data-state={isActive(item.href) ? 'active' : 'inactive'}
              >
                {isActive(item.href) && (
                  <CaretDoubleRightIcon size={12} className='text-orange-500' />
                )}
                {item.label}
              </Nav>
            </Link>
          ))}
        </div>

        <div className='self-end flex items-center gap-2'>
          <ThemeToggle />
        </div>
      </div>
      <div className='w-full h-[0.5px] bg-border' />
    </div>
  )
}
