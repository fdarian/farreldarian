import { Layer, ManagedRuntime } from 'effect'
import { FetchHttpClient } from 'effect/unstable/http'
import { Panel } from './panel'

export const RuntimeServer = ManagedRuntime.make(
	Panel.layer.pipe(Layer.provide(FetchHttpClient.layer))
)
