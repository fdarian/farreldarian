# farreldarian

Bun workspaces monorepo. Personal site + supporting data panel.

## Workspaces
- `apps/web` — public Next.js site
- `packages/config` — shared TypeScript config presets

## Commands
- `bun install` — install deps, link workspaces
- `bun turbo run check` — type-check + lint every workspace
- `bun format` — format the whole repo (biome)
- `bun --cwd apps/web dev` — run the web app
