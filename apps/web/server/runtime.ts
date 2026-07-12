import { Layer, ManagedRuntime } from 'effect'
import { FetchHttpClient } from 'effect/unstable/http'
import { Panel } from './panel/client'

export const RuntimeServer = ManagedRuntime.make(
	Panel.layer.pipe(Layer.provide(FetchHttpClient.layer))
)
