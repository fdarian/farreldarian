# panel

TanStack Start data backend (Effect v4 beta + sqlite). Serves an Effect `HttpApi` at
`/api/v1/*` for `apps/web` to consume — GitHub domain + API v1 land in a follow-up phase.

## Server functions — isolate them

Server functions live in dedicated `*.functions.ts` files. **Never** mix them with
components, hooks, or client utilities in the same file — they're pulled into the
server bundle, and mixing exports leaks closure references that fail mysteriously at
build time.

## Effect v4 beta

This app targets `effect@beta` (pinned to whatever `packages/api-contract` uses — keep
them in sync), not the v3 API most examples online show:

- Services are `Context.Service<Self>()('id', { make: Effect... })`, not
  `Effect.Service`. No `accessors: true`, no auto `.Default` layer — build a
  `static layer = Layer.effect(Self, this.make)` and provide dependencies explicitly.
  Access via `yield* Self` or `Self.use(fn)` / `Self.useSync(fn)`.
- `@effect/sql-drizzle` has no v4 build — `Database` (`src/server/db/service.ts`) is a
  plain `Context.Service` wrapping `drizzle-orm/bun-sqlite` directly, not `@effect/sql`.
- Errors are `Schema.TaggedErrorClass`, not `Schema.TaggedError`.
- Shelling out (see `scripts/better-auth/generate.ts`) uses
  `effect/unstable/process` (`ChildProcess` + `ChildProcessSpawner`), provided via
  `BunServices.layer` from `@effect/platform-bun` — v3's `Command` module moved here.

## Architecture

- `src/server/auth.ts` — better-auth wired through a `Context.Service`. Sign-in is
  **allowlisted to one email** (`src/server/auth/allowlist.ts`) — enforced in
  `databaseHooks.user.create.before`, so it covers every sign-up path (Google OAuth,
  dev email).
- `src/server/auth/dev-email-plugin.ts` — dev-only passwordless email sign-in
  (`NODE_ENV === 'development'` server-side gate, `import.meta.env.DEV` UI gate). Never
  reachable in production.
- `src/server/db/models/auth.ts` — **auto-generated** by better-auth's schema
  generator (`bun better-auth:generate`). Do not edit manually; see
  `scripts/better-auth/generate.ts` + `scripts/better-auth/auth-schema.grit`.
- `entries/better-auth.ts` — CLI-only entrypoint (dummy DB + config layers) so the
  better-auth CLI can introspect `Auth`'s config without a real database.
