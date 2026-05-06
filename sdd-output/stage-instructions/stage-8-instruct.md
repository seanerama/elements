# Stage 8: Polish, Accessibility, Performance

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Conduct a full accessibility audit and close all gaps
- Run Lighthouse against the production build and ensure all gates documented in `contracts/deploy-artifact.md` pass
- Verify bundle-size budgets per page
- Verify Three.js bundle isolation (Stage 5 work — re-verify)
- Audit images, layout shift, and animation behaviors
- Add "skip to content" link, theme-switch UI affordance (even if only one theme ships)
- Produce `sdd-output/tests/lighthouse-baseline.json` recording pass/fail metrics

## What to Build

### Files

- `src/components/SkipLink.astro` — first focusable element on every page; `<a href="#main">Skip to content</a>`
- `src/components/ThemeToggle.tsx` — small island in the nav bar; clicking opens a tiny panel listing available themes (currently only "retro-science"); persists choice to `localStorage` key `elements:theme`. With a single theme, this is a no-op visually but proves the architecture
- Updates to `BaseLayout.astro`: include SkipLink as the first element in `<body>`; mount ThemeToggle in nav; ensure inline pre-paint script reads `elements:theme` from localStorage
- `tests/e2e/a11y.spec.ts` — Playwright + `@axe-core/playwright` — runs axe on `/`, `/elements/h`, `/elements/au`, `/games/element`, `/games/compound`. Asserts 0 critical/serious violations
- `tests/e2e/performance.spec.ts` — Playwright using `playwright-lighthouse` (or running Lighthouse via Chrome DevTools Protocol); asserts Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 90 on the landing page
- `sdd-output/tests/lighthouse-baseline.json` — committed baseline metrics from a passing run; future regressions compared against this
- `tests/e2e/bundle-budget.spec.ts` — Playwright + simple file-size assertions: walks `dist/client/_astro/`, sums chunks loaded by `/`, asserts initial JS ≤ 80 KB gzipped. Asserts Three.js chunk only loads when 3D toggle is clicked
- Updates: every component re-checked for token compliance, animation reduced-motion support, ARIA labels, focus states

### Audit Checklist (executed during this stage)

- [ ] `prefers-reduced-motion`: every animation respects it (Bohr is static anyway, hover transitions disabled, wrong-stamp instant, 3D viz electrons paused or slowed)
- [ ] Focus rings: every interactive element shows a visible 2px `--color-accent-ochre` ring on `:focus-visible`. No `outline: none` without a replacement
- [ ] Color contrast: all token pairs verified at 4.5:1 (large text 3:1)
- [ ] Heading hierarchy: every page has exactly one h1, no skipped levels
- [ ] Image alt text: every `<Image>` has meaningful alt or `alt=""` for decorative
- [ ] Keyboard: every interactive surface reachable; Tab order is logical; Esc closes tooltips/dropdowns
- [ ] Screen reader: cells have `aria-label`, tooltip has `role="tooltip"`, group filter chips have `aria-pressed`, 3D toggle has `aria-expanded`, trivia widget has `aria-live` regions
- [ ] Layout shift (CLS): images have explicit dimensions; fonts use `font-display: swap` with system fallback metrics; no layout jank during font load
- [ ] No console errors or warnings on any page (sample check: landing, 3 detail pages, both games)
- [ ] All Vitest tests pass (`vitest run` exits 0)
- [ ] All Playwright E2E tests pass against the production build
- [ ] `tsc --noEmit` passes; `eslint .` passes; `stylelint "src/**/*.css"` passes; `prettier --check .` passes
- [ ] Build produces `dist/server/entry.mjs` and `dist/client/`
- [ ] Per-page bundle audit via `bundle-budget.spec.ts`
- [ ] Lighthouse run on the production build (started locally on port 8011) against `/`, `/elements/h`, `/games/element` — record results
- [ ] CSS file size: total CSS ≤ 50 KB gzipped (no Tailwind, just tokens + scoped styles)

### Components

- `SkipLink.astro` (small)
- `ThemeToggle.tsx` (small island)

## Interface Contracts

### Exposes

- **Deploy Artifact** (`contracts/deploy-artifact.md`) — by passing all the documented gates, Stage 8 produces a deployable build that Stage 9 consumes

### Consumes

- All prior stages (1–7); Stage 8 audits and closes gaps but does not introduce new features

## Testing Requirements

- [ ] axe-core scan against `/`, `/elements/h`, `/elements/au`, `/games/element`, `/games/compound` returns zero critical/serious violations
- [ ] Lighthouse desktop:
  - `/` Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90
  - `/elements/h` Performance ≥ 90, Accessibility ≥ 95
  - `/games/element` Performance ≥ 85 (slightly lower threshold — interactive game), Accessibility ≥ 95
- [ ] Bundle budget: initial `/` JS ≤ 80 KB gzipped; per-page detail JS ≤ 50 KB gzipped (excluding lazy chunks)
- [ ] Three.js chunk verified: NOT in initial detail-page bundle, IS in lazy chunk loaded only on toggle
- [ ] CSS budget: total CSS shipped on initial render ≤ 50 KB gzipped per page
- [ ] All previous stages' Playwright + Vitest tests still pass

## Pipeline Test: YES

End-to-end gate-runner script (`scripts/stage-8-gate.sh`):

```bash
#!/usr/bin/env bash
set -e
npm ci
tsc --noEmit
eslint .
stylelint "src/**/*.css"
prettier --check .
vitest run
npm run build
node dist/server/entry.mjs &
SERVER_PID=$!
sleep 3
playwright test
kill $SERVER_PID
```

This script must exit 0 for Stage 8 to be considered complete.

## Acceptance Criteria

- [ ] All audit checklist items above are checked off
- [ ] Lighthouse baseline JSON committed at `sdd-output/tests/lighthouse-baseline.json` with passing scores
- [ ] No console errors on any page
- [ ] All deploy-artifact contract gates pass
- [ ] `scripts/stage-8-gate.sh` runs clean on a fresh clone

## Dependencies

- Depends on: Stages 3, 4, 5, 6, 7 (everything user-visible)
- Can parallel with: none (serialized)

## Notes

- **Don't introduce new features in Stage 8.** Polish, fix, audit. If a feature gap is discovered, document it as a follow-up issue and out of MVP — don't expand scope.
- **Lighthouse variance**: scores can fluctuate ±3 between runs even on identical builds. Run 3× and take the median.
- **`@axe-core/playwright`** is the canonical accessibility scanner. Pair with manual screen-reader testing on at least one element page (NVDA on Windows, VoiceOver on macOS — your machine, your call).
- **CSS budget verification**: include a Playwright assertion that walks the `<link rel="stylesheet">` tags on `/`, fetches each, and asserts total gzipped size.
- **Theme toggle**: even shipping with a single theme, the toggle UI proves the architecture works. A future contributor adding `dark-museum.css` only needs to add a file and an entry in the toggle's theme list — no other changes.
- **Skip link** must be visible only on focus (off-screen by default with a CSS positioning trick that brings it on-screen on `:focus`).
- This stage is the difference between "it works" and "it ships." Take it seriously — it's where portfolio polish lives.
