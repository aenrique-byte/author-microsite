# Repository Catalog

This document orients future agents to the structure of the **author-microsite** codebase. Paths are relative to the repository root unless noted.

## Top-Level Docs & Config
- `README.md` – product overview, features, and deployment requirements.
- `SETUP.md`, `SCHEDULE_SYSTEM.md`, `SCHEDULED_PUBLISHING.md`, `DROP_CAP_FEATURE.md`, and `seo_plan.md` – supplementary operational notes.
- TypeScript/Vite/Tailwind configuration: `tsconfig*.json`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`.
- Root build dependencies: `package.json` and `package-lock.json`.

## Frontend (Vite + React, TypeScript)
- Entry wiring lives in `src/app` (`main.tsx`, `router.tsx`, `providers.tsx`).
- Shared UI toolkit is under `src/components` (admin widgets, modals, tables, icons in `shared/components` and `shared/icons`).
- Global styles and helpers: `src/styles`, `src/utils`, `src/contexts`, `src/lib`, `src/types`.
- Feature modules in `src/features`:
  - `home` – landing page assets and sections.
  - `galleries` – gallery cards, filters, and image presentation components.
  - `storytime` – story browsing/reading, contexts, and helper utilities.
  - `litrpg` – LitRPG experience (pages, reusable components, API client in `utils/api-litrpg.ts`, plus legacy constant files for abilities/classes/loot/contracts/monsters/tier/xp).

## Backend API (PHP)
- API endpoints reside in `api/`, organized by domain: `admin`, `analytics`, `auth`, `author`, `chapters`, `collections`, `galleries`, `images`, `litrpg`, `schedules`, `socials`, `stories`, and more.
- Database/bootstrap configuration sample: `api/config.example.php`.
- Reusable SQL snippets live in `api/sql-queries`.
- LitRPG-specific PHP endpoints and helpers sit in `api/litrpg` (abilities, classes, professions, contracts, monsters, items) alongside `bootstrap-litrpg.php` and `export-to-constants.php`.

## Data & Migrations
- Primary schema dump: `unified-schema.sql`.
- Migration scripts in `api/migrations/` (includes `litrpg-full-schema-restore.sql`, seed data, and incremental updates like class tier adjustments and ability evolution changes). `CLOUDFLARE_SETUP.md` documents DNS/traffic setup.

## Static Assets & Public Output
- Client build entry: `index.html`; static assets under `public/` (favicons in `public/icon`, images in `public/images`).
- `scripts/postbuild-copy.mjs` handles post-build asset moves.

## Standalone LitRPG Package
- A separate Vite-based LitRPG bundle lives in `/litrpg` with its own `package.json`, `vite.config.ts`, and constants/components mirroring the main feature bundle. Useful for isolated builds or previews.

## Other Notes
- No AGENTS.md files exist; this catalog serves as the primary agent guide.
- Node dependencies are vendored in `node_modules/` (root) and `litrpg/node_modules/` for the standalone package.
