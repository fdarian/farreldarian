import { ConfigProvider, Effect, Layer } from 'effect'
import { AuthGoogle } from '#/server/auth/google.ts'
import { Auth } from '#/server/auth.ts'
import { Database } from '#/server/db/service.ts'

const layerDummyDatabase = Layer.succeed(
	Database,
	Database.of({
		client: {} as Database['Service']['client'],
		use: <T>(_fn: (db: Database['Service']['client']) => Promise<T>) =>
			Effect.succeed(null as unknown as T),
	})
)

const layerDummyConfig = ConfigProvider.layer(
	ConfigProvider.fromUnknown({
		AUTH_GOOGLE_ID: 'dummy',
		AUTH_GOOGLE_SECRET: 'dummy',
	})
)

export const auth = Auth.use((auth) => Effect.succeed(auth.client)).pipe(
	Effect.provide(
		Auth.layer.pipe(
			Layer.provide(AuthGoogle.layer),
			Layer.provide(layerDummyDatabase),
			Layer.provide(layerDummyConfig)
		)
	),
	Effect.runSync
)
