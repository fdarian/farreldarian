import { createCsrfMiddleware, createStart } from '@tanstack/react-start'
import { wrapErrorsMiddleware } from './server/errors/server-fn-middleware.ts'

const csrfMiddleware = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => {
	return {
		requestMiddleware: [csrfMiddleware],
		functionMiddleware: [wrapErrorsMiddleware],
	}
})
