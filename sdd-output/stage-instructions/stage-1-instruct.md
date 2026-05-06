# Stage 1: Foundation & Theme System

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Scaffold an Astro 5 project with the Node adapter (standalone), TypeScript strict, ESLint, Prettier, Vitest, Playwright
- Establish the design-token CSS layer and the `retro-science` default theme so every subsequent stage builds against the visual system
- Wire IBM Plex fonts and Phosphor icons
- Produce a working `BaseLayout.astro` and a placeholder home page that renders inside the design system
- Configure PM2's `ecosystem.config.cjs` so Stage 9 can deploy the resulting build with no further structural work

## What to Build

### Files

- `package.json` — Node 20+, Astro 5, `@astrojs/node`, `@astrojs/react`, `react`, `react-dom`, `typescript`, `eslint`, `prettier`, `vitest`, `@playwright/test`, `@fontsource/ibm-plex-{serif,sans,mono}`, `@phosphor-icons/react`, `stylelint`, `stylelint-declaration-strict-value`
- `astro.config.mjs` — Node adapter standalone, React integration, Vite config for any Vitest aliases
- `tsconfig.json` — strict, `noUncheckedIndexedAccess`, path alias `@/* → src/*`
- `ecosystem.config.cjs` — PM2 app config: name `elements`, script `dist/server/entry.mjs`, port 8011, `127.0.0.1` bind, log paths under `/var/log/pm2/`
- `.env.example` — documented runtime env (HOST, PORT, NODE_ENV)
- `.eslintrc.cjs`, `.prettierrc`, `.stylelintrc.cjs`
- `playwright.config.ts`, `vitest.config.ts`
- `src/styles/tokens.css` — full token inventory from `design-system.md` (paper, ink, category, accent, semantic colors; type, space, border, radius, shadow scales)
- `src/styles/themes/retro-science.css` — default theme that re-exposes tokens under `[data-theme="retro-science"]`
- `src/styles/base.css` — minimal reset, body defaults (font, color, bg), heading defaults using token vars
- `src/layouts/BaseLayout.astro` — `<html data-theme>`, head meta, font preloads, slot for content, inline pre-paint script that reads `localStorage` for theme
- `src/pages/index.astro` — placeholder that renders "Elements" wordmark and a single line "Periodic Table coming soon" — used solely as a Stage 1 smoke target
- `src/components/Wordmark.astro` — small reusable component for the "ELEMENTS" mark (used in nav and placeholder)
- `tests/unit/smoke.test.ts` — token presence smoke (parses tokens.css, asserts ≥ 30 `--color-*` properties exist)
- `tests/e2e/foundation.spec.ts` — Playwright smoke that loads `/`, asserts wordmark renders, asserts CSS custom property `--color-paper` is `#f5f0e6` on `<html>`

### Components

- `BaseLayout.astro` — wraps every page, loads tokens + base CSS, sets `data-theme`, handles `<head>` meta and font loading
- `Wordmark.astro` — "ELEMENTS" text in IBM Plex Serif 600, small caps

## Interface Contracts

### Exposes

- **Design Tokens** (`contracts/design-tokens.md`) — full token namespace, theme switching mechanism, and the rule that downstream stages must reference tokens, never raw values

### Consumes

- Nothing — Stage 1 is the foundation

## Testing Requirements

- [ ] Vitest smoke test: token CSS file parses, has the documented ~60 tokens
- [ ] Playwright smoke: dev server boots, `/` renders, computed `--color-paper` matches the documented hex
- [ ] `npm run build` succeeds and produces `dist/server/entry.mjs`
- [ ] `node dist/server/entry.mjs` boots the Node server on 8011 and serves a 200 on `/`
- [ ] `tsc --noEmit` passes
- [ ] `eslint .` passes
- [ ] `stylelint "src/**/*.css"` passes
- [ ] `prettier --check .` passes

## Pipeline Test: YES

Pipeline test validates the entire Stage 1 toolchain end-to-end:

```bash
npm ci
npm run build
node dist/server/entry.mjs &  # background
sleep 2
curl -sf http://127.0.0.1:8011/ | grep -q "ELEMENTS"
kill %1
```

This should succeed in CI on a clean checkout.

## Acceptance Criteria

- [ ] Project structure matches the layout in `project-plan.md`
- [ ] All token namespaces from `design-system.md` are present in `tokens.css`
- [ ] Theme switch via `data-theme` works (manually toggle via DevTools, observe `--color-paper` change)
- [ ] No FOUC on initial load (theme attribute set before paint)
- [ ] IBM Plex Serif/Sans/Mono load and are applied correctly
- [ ] PM2 ecosystem config is committed and matches `deploy-instruct.md`
- [ ] Stylelint blocks raw color/spacing/font-size values outside `tokens.css` and `themes/*.css`
- [ ] All testing requirements above pass

## Dependencies

- Depends on: none
- Can parallel with: none (foundation is serialized first)

## Notes

- **Lock TS strictness early.** Future stages assume `noUncheckedIndexedAccess` is on; turning it off later means a refactor.
- The placeholder home page at `/` is **temporary**. Stage 3 replaces it with the actual periodic table landing.
- Phosphor icons should be tree-shaken — import individually (`import { Cube } from '@phosphor-icons/react'`), never `import * as`.
- Keep the inline pre-paint script that sets `data-theme` minimal (under 200 bytes) — it ships in every `<head>`.
- Add a CSS rule in stylelint that rejects `#[0-9a-fA-F]{3,8}` outside `src/styles/tokens.css` and `src/styles/themes/*.css` to enforce token usage.
- `data/` directory will exist but be empty until Stage 2 — that's fine.
