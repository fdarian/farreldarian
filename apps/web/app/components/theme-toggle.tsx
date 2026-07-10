'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Nav } from './nav'

const themeMap = {
  light: 'dark',
  dark: 'system',
  system: 'light',
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <Nav
      onClick={() => {
        if (!theme) return
        const dest = themeMap[theme as keyof typeof themeMap]
        if (!dest) return
        setTheme(dest)
      }}
    >
      : {mounted ? (theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System') : 'System'}
    </Nav>
  )
}
