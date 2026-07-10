# web

Public personal site.

## Stack
- Next.js (App Router), React 19
- Tailwind CSS
- Biome

## Dev
- `bun --cwd apps/web dev`
- `bun --cwd apps/web run check:type` / `check:lint`

## Architecture
- `app/` — routes (App Router)
- `app/components/` — nav, source link, theme toggle
- `styles/global.css` — CSS vars, imported in `app/layout.tsx`
- `utils/class.ts` — `cn` classname helper
