# web

Public personal site.

## Stack
- Next.js (App Router), React 19 — real RSC, so `'use client'` is meaningful here (unlike TanStack Start)
- Tailwind CSS v4 (CSS-driven, no `tailwind.config.js`)
- shadcn on **Base UI** (`@base-ui/react`, no Radix), design system is the **`@coss` (coss.com/ui) registry** — its tokens/components are adopted as-is, not stock shadcn zinc/new-york
- Biome

## Dev
- `bun --cwd apps/web dev`
- `bun --cwd apps/web run check:type` / `check:lint`

## Architecture
- `app/` — routes (App Router)
- `app/components/` — nav, source link, theme toggle
- `components/ui/` — vendored `@coss/style` components (from `shadcn init @coss/style`); treat as generated, don't hand-edit — `components.json` `overrides` in `biome.jsonc` disables a11y rules there for known upstream lint findings
- `styles/global.css` — `@theme inline` tokens from the coss design system, imported in `app/layout.tsx`
- `lib/utils.ts` — `cn` classname helper (clsx + tailwind-merge)
- `lib/panel.ts` — server-only Effect `HttpApiClient` for `@repo/api-contract`'s `PanelApi`; exports `getActivity()` / `listProjects()`. Requires `PANEL_API_URL` + `PANEL_API_KEY` (throws if unset — never call from a statically-prerendered route without `export const dynamic = 'force-dynamic'`)

## Conventions
- Single import alias: `@/*` → repo root (e.g. `@/lib/utils`, `@/components/ui/button`)
- Base UI components use `render={<element />}` instead of Radix's `asChild`, and `data-active`/`data-disabled` instead of `data-state=active|inactive`
- New components: `bunx shadcn add @coss/<name>` (font is Geist, kept independent of the coss design system per explicit direction)

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.
<!-- END:nextjs-agent-rules -->
