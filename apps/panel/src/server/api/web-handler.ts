import { PanelApi } from '@repo/api-contract'
import { Layer } from 'effect'
import { HttpRouter, HttpServer } from 'effect/unstable/http'
import { HttpApiBuilder, HttpApiScalar } from 'effect/unstable/httpapi'
import { layerMain } from '#/server/runtime.ts'
import { ApiKeyAuthLive } from './auth-middleware.ts'
import { FeedApiLive } from './handlers.ts'

// Provided sequentially so each `Layer.provide` step resolves the previous
// step's leftover requirements against the new layer's output. `FeedApiLive`
// requires `ApiKeyAuth` (its group-level middleware tag) plus `Github`/`Repos`
// (used inside the handlers); `ApiKeyAuthLive` supplies `ApiKeyAuth` but
// itself requires `Auth`; `layerMain` (the same composition backing the
// app's `ManagedRuntime`, see `src/server/runtime.ts`) supplies
// Auth/Database/Github/Repos. `HttpServer.layerServices` supplies the
// low-level platform services (`Etag.Generator`/`FileSystem`/`HttpPlatform`/`Path`)
// `HttpApiBuilder.layer` itself needs.
//
// `layerMain` is `provideMerge`d (not plain `provide`) because per-handler
// `Requires` (see `Handlers.handle`) are only excluded from the web handler's
// context parameter when they're visible in the *output* of the composed
// layer — `Layer.provide` would satisfy them internally but drop them from
// that output, leaving them as a phantom required context param.
const ApiHandlersLive = HttpApiBuilder.layer(PanelApi, {
	openapiPath: '/api/v1/spec.json',
}).pipe(
	Layer.provide(FeedApiLive),
	Layer.provide(ApiKeyAuthLive),
	Layer.provideMerge(layerMain),
	Layer.provide(HttpServer.layerServices)
)

const DocsLive = HttpApiScalar.layer(PanelApi, { path: '/api/v1/docs' })

const AllLayers = Layer.mergeAll(ApiHandlersLive, DocsLive)

const webHandler = HttpRouter.toWebHandler(AllLayers)

export const handler = webHandler.handler
