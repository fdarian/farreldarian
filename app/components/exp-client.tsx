'use client'

import { useSyncExternalStore } from 'react'

export function ExpNumber() {
  return useSyncExternalStore(
    () => () => {},
    () => `${String(new Date().getUTCFullYear() - 2021)}y`,
    () => '⠀'
  )
}
