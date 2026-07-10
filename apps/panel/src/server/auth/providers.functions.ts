import { createServerFn } from '@tanstack/react-start'
import { Auth } from '../auth.ts'
import { RuntimeServer } from '../runtime.ts'

export const getEnabledAuthProviders = createServerFn({
	method: 'GET',
}).handler(() =>
	Auth.useSync((auth) => auth.enabledProviders).pipe(RuntimeServer.runPromise)
)
