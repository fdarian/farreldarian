// Importing from the package root pulls in every Bun platform submodule
// (including BunRedis, which does a top-level `import "bun"` that Vite's dev
// SSR module runner can't resolve) — import the specific submodule instead.
import * as BunServices from '@effect/platform-bun/BunServices'
import { Layer, ManagedRuntime } from 'effect'
import { createRunPromiseUnwrapped } from '#/lib/effect/utils/run-promise-unwrapped.ts'
import { AuthGoogle } from './auth/google.ts'
import { Auth } from './auth.ts'
import { Database } from './db/service.ts'
import { Github } from './github/service.ts'
import { Repos } from './repos/service.ts'

const layersCore = Auth.layer
const layersInfra = Layer.mergeAll(
	Database.layer,
	AuthGoogle.layer,
	Github.layer,
	Repos.layer.pipe(Layer.provide(Database.layer))
)

export const layerMain = layersCore.pipe(
	Layer.provideMerge(layersInfra),
	Layer.provideMerge(BunServices.layer)
)
const runtime = ManagedRuntime.make(layerMain)

export const RuntimeServer = {
	runPromise: createRunPromiseUnwrapped(runtime),
	runSync: runtime.runSync,
}
