/**
 * Documented custom client entry (https://tanstack.com/start/v0/docs/framework/react/guide/client-entry-point).
 * Defined explicitly because the auto-generated default 404s in pnpm/Bun monorepos
 * (TanStack Start issue #6588), which blocks React hydration.
 */
import { StartClient } from '@tanstack/react-start/client'
import { StrictMode, startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'

startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<StartClient />
		</StrictMode>
	)
})
