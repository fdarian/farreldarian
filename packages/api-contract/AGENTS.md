# api-contract

Shared Effect `HttpApi` definition for the panel/web API — source of truth for both sides, no build step.

## Stack
- Effect v4 beta (`effect/unstable/httpapi`)

## Dev
- `bun --cwd packages/api-contract run check:type` / `check:lint`

## Architecture
- `src/schemas.ts` — `ActivityItem`, `ActivityResponse`, `Project`, `ProjectsQuery`, `ProjectsResponse`
- `src/auth.ts` — `ApiKeyAuth` middleware (`HttpApiSecurity.apiKey` on the `Authorization` header), `CurrentApiCaller` tag, `Unauthorized` error
- `src/api.ts` — `FeedGroup` (`activity`, `projects` endpoints), `PanelApi` (`HttpApi.make('panel')`, prefixed `/api/v1`)
- `src/index.ts` — public re-exports (package entry point per `exports` in `package.json`)

The panel implements `PanelApi` with `HttpApiBuilder`; the web derives a typed `HttpApiClient` from it.
