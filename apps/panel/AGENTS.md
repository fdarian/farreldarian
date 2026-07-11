# panel

TanStack Start data backend (Effect v4 beta + sqlite). Serves an Effect `HttpApi`
(`@repo/api-contract`) at `/api/v1/*` for `apps/web` to consume — activity feed +
projects, backed by a toggle over my GitHub repos.

## Env

- `GITHUB_TOKEN` — optional at boot (the whole shared runtime would otherwise refuse to
  start for every request, not just GitHub-touching ones); required for `/repos`,
  `/api/v1/activity`, and `/api/v1/projects` to actually return data. A missing token
  fails those specific calls with a `GithubError`, nothing else.
- `GITHUB_USERNAME` — defaults to `farreldarian`.
- `WEB_REVALIDATE_URL` / `REVALIDATE_SECRET` — both optional; when set, a contributions
  sync POSTs to `WEB_REVALIDATE_URL` (the web app's `/api/revalidate`) with
  `Authorization: Bearer <REVALIDATE_SECRET>` to bust its `activity`/`projects` cache
  tags early instead of waiting out `cacheLife('hours')`. Missing either just skips
  the call (logged at debug), same "optional wiring" pattern as `GITHUB_TOKEN`.

## Dev server — `bun-process` runner required

`vite dev` defaults nitro's dev server to a **Node worker** regardless of the build
`preset` (`preset: 'bun'` only applies to `vite build` output) — so anything touching
`drizzle-orm/bun-sqlite` (→ the `bun:sqlite` builtin) fails under plain `vite dev` with
`Only URLs with a scheme in: file, data, and node are supported`, tracing into real
`node:internal/modules/esm/*` even though the host process is Bun. Fixed by forcing the
`bun-process` dev runner — both `nitro({ devServer: { runner: 'bun-process' } })` in
`vite.config.ts` and `NITRO_DEV_RUNNER=bun-process` on the `dev` script in
`package.json` (belt and suspenders; either alone is sufficient). Confirmed this fixes
auth end-to-end under `vite dev`, including a live dev-email sign-in with a session
cookie back and the allowlist correctly rejecting a non-allowlisted email.

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
- `src/server/repos/drizzle.ts` — the `repos` table (co-located with the domain, per
  convention — not under `db/models/`, which is reserved for generated schemas).
  `isPersonalProject` toggle, `tags`, `status`/`year`. `drizzle.config.ts`'s `schema`
  glob picks up both `db/models/*` (generated) and `**/drizzle.ts` (hand-written).
- `src/server/github/service.ts` — GitHub REST client (`Github` service): my owned
  repos + a generic `/search/issues` wrapper. Token is read via `Config.option` (not
  required), see "Env".
- `src/server/contributions/` — sqlite mirror of my merged PRs (`Contributions`
  service, `drizzle.ts`'s `merged_pull_requests` table). `activity` reads this
  instead of calling GitHub live — the Search API caps at 1000 results and
  30 req/min, too little/slow for a per-request fetch. `bun contributions:backfill`
  (`scripts/contributions/backfill.ts`) does a one-off full-history sync, bisecting
  the `merged:` date window to stay under the 1000 cap; `Contributions` forks a
  cheap `updated:>=`-windowed catch-up sync on boot (no-ops with a warning until
  the backfill has run once); `syncContributions` (`contributions.functions.ts`) is
  the same catch-up exposed as an authed on-demand server fn; `POST
  /api/v1/contributions/sync` (`api/contributions-handlers.ts`, api-key-authed, for a
  cron) runs the same incremental sync synchronously, or forks the full backfill in the
  background if the table's still empty rather than blocking the request.
- `src/server/revalidation/service.ts` — `Revalidation` service: POSTs to the web app's
  revalidate endpoint after a sync commits rows (see "Env"). Failure is swallowed at the
  call site (`contributions/service.ts`) — a sync must never fail because revalidation did.
- `src/server/api/` — the HttpApi v1 server: `handlers.ts` (`FeedApiLive`, implements
  `@repo/api-contract`'s `FeedGroup`), `auth-middleware.ts` (`ApiKeyAuthLive`, verifies
  the `Authorization` header against better-auth's api-key store), `web-handler.ts`
  (composes everything + Scalar docs at `/api/v1/docs`, mounted at
  `src/routes/api/v1/$.ts` via `HttpRouter.toWebHandler` — v4's replacement for v3's
  `HttpApiBuilder.toWebHandler`, gone in this beta).
  - **Gotcha**: per-handler `Requires` (e.g. `Github`/`Repos` used inside a handler
    body) are only excluded from the web handler's `(request, context)` signature when
    they're visible in the *output* of the fully composed layer — providing them via
    plain `Layer.provide` satisfies the requirement internally but drops them from that
    output, leaving a phantom required second argument. Use `Layer.provideMerge` for
    whichever layer supplies them (see `web-handler.ts`).
