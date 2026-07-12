import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './auth/session.functions.ts'

/**
 * A normal TanStack server-function factory with authentication pre-applied.
 * Keeping TanStack's native `.handler()` terminal is required for its compiler
 * to extract the handler from the client bundle.
 */
export const protectedServerFn = createServerFn().middleware([authMiddleware])
