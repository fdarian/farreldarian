import type { Register } from '@tanstack/react-router'
import {
	createServerFn,
	type Fetcher,
	type Method,
	type ServerFnCtx,
	type ServerFnOptions,
	type ServerFnStrict,
} from '@tanstack/react-start'
import type * as Effect from 'effect/Effect'
import { RuntimeServer } from '#/server/runtime.ts'
import { authMiddleware } from './auth/session.functions.ts'

type ProtectedMiddlewares = readonly [typeof authMiddleware]

interface ProtectedServerFn<
	TMethod extends Method,
	TStrict extends ServerFnStrict,
	TInputValidator = undefined,
> {
	validator<TNewInputValidator>(
		validator: TNewInputValidator
	): ProtectedServerFn<TMethod, TStrict, TNewInputValidator>

	effect<A, E, R>(
		handler: (
			context: ServerFnCtx<
				Register,
				TMethod,
				ProtectedMiddlewares,
				TInputValidator
			>
		) => Effect.Effect<A, E, R>
	): Fetcher<ProtectedMiddlewares, TInputValidator, Promise<A>>
}

interface InternalBuilder {
	validator(validator: unknown): InternalBuilder
	handler(handler: (context: unknown) => Promise<unknown>): unknown
}

export const protectedServerFn = <
	TMethod extends Method,
	TStrict extends ServerFnStrict = true,
>(
	options: ServerFnOptions<TMethod, TStrict>
): ProtectedServerFn<TMethod, TStrict> => {
	const wrap = <TInputValidator>(
		builder: InternalBuilder
	): ProtectedServerFn<TMethod, TStrict, TInputValidator> => ({
		validator: (validator) => wrap(builder.validator(validator)),
		effect: (handler) =>
			builder.handler((context) =>
				RuntimeServer.runPromise(handler(context as never) as never)
			) as never,
	})

	return wrap(
		createServerFn(options).middleware([
			authMiddleware,
		]) as unknown as InternalBuilder
	)
}
