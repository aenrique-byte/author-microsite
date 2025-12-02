# LitRPG Agent Notes (SQL-First)

- Prefer MySQL-backed API data over legacy constant files. Use the helpers in `utils/api-litrpg.ts` (e.g., `listItems`, `listClasses`, `listAbilities`) instead of importing `*-constants.ts` datasets.
- When you need static metadata (like color maps), keep it small and UI-focused—never reintroduce large gameplay datasets as constants.
- Cache reads should go through the existing "getCached" helpers where available to avoid redundant network calls.
- If you add new LitRPG UI, wire it to the PHP endpoints under `api/litrpg/` and keep typings alongside the API utilities.
