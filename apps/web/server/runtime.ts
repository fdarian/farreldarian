import { Layer, ManagedRuntime } from 'effect'
import { FetchHttpClient } from 'effect/http'
import { Panel } from './panel/client'

export const RuntimeServer = ManagedRuntime.make(
	Panel.layer.pipe(Layer.provide(FetchHttpClient.layer))
)
