import { Context, Schema } from 'effect'
import { HttpApiMiddleware, HttpApiSecurity } from 'effect/unstable/httpapi'

/** The caller identity attached to the request context once `ApiKeyAuth` verifies the key. */
export class CurrentApiCaller extends Context.Service<
	CurrentApiCaller,
	{ userId: string }
>()('CurrentApiCaller') {}

export class Unauthorized extends Schema.TaggedErrorClass<Unauthorized>()(
	'Unauthorized',
	{},
	{ httpApiStatus: 401 }
) {}

/** Verifies the `Authorization` header against the panel's api-key store and provides `CurrentApiCaller`. */
export class ApiKeyAuth extends HttpApiMiddleware.Service<
	ApiKeyAuth,
	{ provides: CurrentApiCaller }
>()('ApiKeyAuth', {
	error: Unauthorized,
	security: {
		apiKey: HttpApiSecurity.apiKey({ key: 'Authorization', in: 'header' }),
	},
}) {}
