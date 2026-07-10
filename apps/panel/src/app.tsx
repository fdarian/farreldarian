import { RouterProvider } from '@tanstack/react-router'
import type { getRouter } from './router'

export function App({ router }: { router: ReturnType<typeof getRouter> }) {
	return <RouterProvider router={router} />
}
