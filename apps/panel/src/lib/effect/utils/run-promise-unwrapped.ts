import { Cause, Exit, type ManagedRuntime } from 'effect'

export function createRunPromiseUnwrapped<
	T extends ManagedRuntime.ManagedRuntime<any, any>,
>(runtime: T): T['runPromise'] {
	return (async (effect: any) => {
		const exit = await runtime.runPromiseExit(effect)
		if (Exit.isSuccess(exit)) return exit.value

		const failReason = exit.cause.reasons.find(Cause.isFailReason)
		if (failReason) throw failReason.error

		const dieReason = exit.cause.reasons.find(Cause.isDieReason)
		if (dieReason) throw dieReason.defect

		throw exit.cause
	}) as T['runPromise']
}
