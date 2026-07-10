import { createMiddleware } from '@tanstack/react-start'
import { Effect } from 'effect'
import * as S from 'effect/Schema'
import { RuntimeServer } from '../runtime.ts'

/** Error whose `message` is safe to re-throw to the client as-is. */
export class ExposeError extends S.TaggedErrorClass<ExposeError>()(
	'ExposeError',
	{
		message: S.String,
		cause: S.optional(S.Unknown),
	}
) {
	constructor(message: string, cause?: unknown) {
		super({ message, cause })
	}
}

export const wrapErrorsMiddleware = createMiddleware({
	type: 'function',
}).server(async ({ next }) => {
	try {
		return await next()
	} catch (err) {
		if (err instanceof Response) throw err
		if (err instanceof ExposeError) {
			if (err.cause !== undefined) {
				RuntimeServer.runSync(
					Effect.logError('Server function error').pipe(
						Effect.annotateLogs({ message: err.message, cause: err.cause })
					)
				)
			}
			throw new Error(err.message)
		}

		RuntimeServer.runSync(
			Effect.logError('Unhandled server function error').pipe(
				Effect.annotateLogs({ error: err })
			)
		)
		throw new Error('Internal Server Error')
	}
})
