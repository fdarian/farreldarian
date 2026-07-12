import type * as Effect from 'effect/Effect'
import { RuntimeServer } from './runtime.ts'

/** Resolve a server Effect using the application's shared runtime. */
export const runServerEffect = <A, E, R>(effect: Effect.Effect<A, E, R>) =>
	RuntimeServer.runPromise(effect as never) as Promise<A>
