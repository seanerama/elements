# Stage 3: Periodic Table Landing Page

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Replace the Stage 1 placeholder home page with the real periodic table landing
- Render all 118 elements as `<ElementCell>` components in standard IUPAC layout
- Implement hover quick-look tooltip
- Implement category group filter (clicking a chip dims non-matching cells)
- Implement client-side fuzzy search (Fuse.js) over name / symbol / atomic number
- Implement full keyboard navigation across the table grid (arrow keys, Enter, Esc)

## What to Build

### Files

- `src/pages/index.astro` — replaces placeholder; SSG'd; loads all elements via `loadAllElements()` and renders the periodic table
- `src/components/PeriodicTable.astro` — grid layout, slots in 118 `<ElementCell>` components, places lanthanides/actinides in their inner rows, includes group filter chips above and search box top-right
- `src/components/ElementCell.astro` — single cell: top stripe in `--color-cat-<category>`, atomic number (mono caption), symbol (serif h2), name (sans body-sm), atomic mass (mono caption), `aria-label` per `design-system.md`
- `src/components/HoverTooltip.tsx` — React island; hydrates only on hover; positioned via Floating UI; renders the documented tooltip layout
- `src/components/GroupFilter.tsx` — React island; chip row with toggle state; emits filter changes via custom event that the table listens for to dim non-matching cells
- `src/components/SearchBox.tsx` — React island; wraps Fuse.js; result dropdown with deep links to `/elements/<symbol>`
- `src/lib/search.ts` — builds Fuse.js index from `Element[]`; tunes weights (symbol > name > atomic_number > category)
- `src/lib/keyboard-nav.ts` — pure utility; given (currentIndex, key, gridLayout) returns nextIndex; handles row/column wrapping and lanthanide/actinide row navigation
- `tests/unit/search.test.ts` — Vitest: search index returns expected matches for "hyd", "Au", "82", "noble"
- `tests/unit/keyboard-nav.test.ts` — Vitest: arrow-key navigation moves between expected cells (including across the lanthanide gap)
- `tests/e2e/landing.spec.ts` — Playwright covering the pipeline test below

### Components

- `PeriodicTable.astro` — static grid orchestrator
- `ElementCell.astro` — inert (no JS); category color stripe + content
- `HoverTooltip.tsx` — React island, hydrate `client:idle` (or `client:visible`)
- `GroupFilter.tsx` — React island, hydrate `client:load` (interactive on load)
- `SearchBox.tsx` — React island, hydrate `client:load`

## Interface Contracts

### Exposes

- **Periodic Table Landing route** at `GET /` rendering all 118 elements
- A canonical search index (`src/lib/search.ts`) reusable from any future page that needs element search

### Consumes

- **Element Schema** (Stage 2) via `loadAllElements()`
- **Image Asset** (Stage 2) — only for tooltip/cell rendering if a tiny thumbnail is later wanted; not required for MVP cell
- **Design Tokens** (Stage 1) — every visual property

## Testing Requirements

- [ ] Vitest: search returns Hydrogen for "h", "hyd", "1"; returns Gold for "au", "gold", "79"; ranks by symbol > name > number
- [ ] Vitest: keyboard nav from cell 1 (H) with `ArrowRight` → cell 2 (He); from cell 1 with `ArrowDown` → cell 3 (Li); from cell 57 (La) with `ArrowDown` → cell 72 (Hf), with `ArrowUp` from cell 72 → cell 57; from cell 71 (Lu) with `ArrowDown` jumps to lanthanide row first or stays
- [ ] Playwright: landing page renders all 118 cells in correct grid positions
- [ ] Playwright: hovering cell #6 (C) reveals tooltip containing "Carbon", "12.011", "Nonmetal"
- [ ] Playwright: clicking the "Noble gases" filter chip dims non-noble cells (opacity 0.25) and leaves He, Ne, Ar, Kr, Xe, Rn, Og at full opacity
- [ ] Playwright: typing "gold" in search box shows Gold (Au) at top of dropdown; pressing Enter navigates to `/elements/au`
- [ ] Playwright: tabbing into the table grid + arrow-key navigation works as documented; Enter on focused cell navigates to its detail page
- [ ] Lighthouse Performance score on `/` ≥ 90 desktop (no Three.js, minimal client JS)

## Pipeline Test: YES

Full landing-page integration test in Playwright:

1. Navigate to `/`
2. Assert all 118 element cells present (`getByRole('button', { name: /atomic number/ })` count = 118)
3. Hover cell `[data-symbol="C"]` → tooltip visible with "Carbon"
4. Click `[data-filter="noble-gas"]` → assert non-noble cells have opacity 0.25
5. Click `[data-filter="noble-gas"]` again → assert filter cleared
6. Focus search box, type `"gold"`, assert dropdown shows "Gold (Au)" first, press Enter, assert URL is `/elements/au`
7. Browser back, focus first table cell via Tab, press `ArrowRight` → assert He focused; `ArrowDown` → assert Be focused (since He is row 1 col 18, Down → no cell → wrap or stop)

## Acceptance Criteria

- [ ] All 118 cells render in correct IUPAC positions
- [ ] Hover tooltip appears within 120ms with no layout jitter
- [ ] Search returns results in < 50ms
- [ ] Keyboard nav covers the entire grid; no cell unreachable
- [ ] All cells have `aria-label` per design-system spec
- [ ] Initial JS bundle on `/` is ≤ 80 KB gzipped (Three.js excluded; not needed on landing)
- [ ] All component CSS uses design tokens (stylelint passes)
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95 on the landing page

## Dependencies

- Depends on: Stage 1 (foundation), Stage 2 (data)
- Can parallel with: none (serialized)

## Notes

- The landing is the most-judged page (it's what people see first). Spend time on the cell hover micro-interactions — they should feel deliberate, not springy.
- Don't ship Fuse.js for users who don't open the search box. Hydrate `SearchBox` with `client:load`, but the Fuse index can be built lazily on first focus.
- The lanthanide/actinide inner rows render below the main grid with a small label and a thin `--color-rule` divider above.
- The hover tooltip uses Floating UI to handle viewport edges gracefully — the rightmost cells (group 18) need the tooltip to flip left.
- Group filter state should also support URL params (`/?filter=noble-gas`) so deep-links work and back/forward feels natural. This is a cheap win.
- **Out of scope for this stage**: a "compare" mode, a "view as list" mode, sorting. Those are future stages or post-MVP.
