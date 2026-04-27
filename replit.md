# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Pixel Pad (`artifacts/pixel-art-creator`)
- **Preview path**: `/`
- **Type**: React + Vite (frontend-only, no backend needed)
- **Persistence**: localStorage (browser-local storage)
- **Features**:
  - Main Menu with mode selection
  - Creative Mode: pen, eraser, blotch, fill, line, eyedropper tools; full color spectrum; 20 custom palette slots per project
  - Junior Mode: kid-friendly tools (pen, eraser, fill, stamp, circle, square, star, rainbow); 30+ premade pixel stamp shapes; bright 20-color palette
  - Shared: zoom in/out, grid toggle, undo/redo (50 steps), toolbar minimize/expand, clear canvas, save canvas
  - Project Gallery: up to 32 projects, paginated at 18 per page (2 pages), thumbnails, delete, reopen
- **Key files**:
  - `src/lib/types.ts` — all types, constants, color palettes
  - `src/lib/storage.ts` — localStorage persistence, thumbnail generation
  - `src/lib/stamps.ts` — 30+ pixel stamp shape definitions
  - `src/lib/utils.ts` — flood fill, blotch, line drawing algorithms
  - `src/components/PixelCanvas.tsx` — main drawing canvas (HTML5 Canvas)
  - `src/components/ColorSpectrum.tsx` — full color spectrum picker
  - `src/components/CustomPalettePanel.tsx` — 20-slot custom palette
  - `src/components/StampPanel.tsx` — categorized stamp browser
  - `src/pages/MainMenu.tsx` — mode selection landing
  - `src/pages/Gallery.tsx` — project gallery with pagination
  - `src/pages/CreativeEditor.tsx` — creative mode editor
  - `src/pages/JuniorEditor.tsx` — junior mode editor
