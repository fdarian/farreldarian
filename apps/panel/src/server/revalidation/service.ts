import { Config, Context, Effect, Layer, Option, Schema } from 'effect'

// `Schema.Defect` is broken in effect@4.0.0-beta.97 (crashes building the AST) —
// `Schema.Unknown` is the workaround until it's fixed upstream.
export class RevalidationError extends Schema.TaggedErrorClass<RevalidationError>()(
	'RevalidationError',
	{ cause: Schema.Unknown }
) {}

/**
 * Tells the web app to bust its `activity`/`projects` cache tags — called
 * after a contributions sync actually commits new rows, so the site doesn't
 * keep serving a stale snapshot for the full `cacheLife('hours')` window.
 */
export class Revalidation extends Context.Service<Revalidation>()(
	'server/revalidation',
	{
		make: Effect.gen(function* () {
			// Both optional — this is opt-in wiring to an external (web app)
			// endpoint, not something the panel should refuse to boot over.
			const url = yield* Config.string('WEB_REVALIDATE_URL').pipe(Config.option)
			const secret = yield* Config.string('WEB_REVALIDATE_SECRET').pipe(
				Config.option
			)

			const revalidate = (): Effect.Effect<void, RevalidationError> =>
				Effect.gen(function* () {
					if (Option.isNone(url) || Option.isNone(secret)) {
						yield* Effect.logDebug(
							'[revalidation] WEB_REVALIDATE_URL/WEB_REVALIDATE_SECRET not configured — skipping'
						)
						return
					}

					const response = yield* Effect.tryPromise({
						try: () =>
							fetch(url.value, {
								method: 'POST',
								headers: { Authorization: `Bearer ${secret.value}` },
							}),
						catch: (cause) => new RevalidationError({ cause }),
					})

					if (!response.ok) {
						return yield* new RevalidationError({
							cause: `revalidate responded ${response.status}`,
						})
					}
				})

			return { revalidate }
		}),
	}
) {
	static layer = Layer.effect(Revalidation, this.make)
}
