# Stage 4: Element Detail Pages + Bohr Diagrams

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Build dynamic element detail page route at `/elements/[symbol]` SSG'd over all 118 elements
- Implement the hero band, properties / occurrence / reactivity / electron config / compounds / uses / discovery cards per design spec
- Generate inline SVG Bohr diagrams from each element's `electrons_per_shell` array
- Add prev/next element navigation (atomic-number-ordered)
- Render the primary image with attribution caption and proper `<Image>` optimization

## What to Build

### Files

- `src/pages/elements/[symbol].astro` — dynamic route; uses `getStaticPaths()` to enumerate all 118; loads via `loadElement(symbol)`; throws 404 (returns null path) for unknown symbols
- `src/components/ElementHero.astro` — hero band: category color stripe, atomic number (mono h2 top-left), symbol (serif display center), name + meta line below, primary image to the right
- `src/components/DetailCard.astro` — generic paper-card wrapper with eyebrow + title + slot
- `src/components/PropertiesCard.astro` — atomic mass, density, melting/boiling points, electronegativity, oxidation states, phase at STP — all numeric data in IBM Plex Mono
- `src/components/OccurrenceCard.astro` — natural abundance, occurrence states, isotopes summary
- `src/components/ReactivityCard.astro` — reactivity_summary text
- `src/components/ElectronConfigCard.astro` — full + short electron config (mono), electrons-per-shell list
- `src/components/CompoundsCard.astro` — list of `compounds` with formula (mono with subscripted digits), name (serif), summary (sans)
- `src/components/UsesCard.astro` — bulleted `uses` list
- `src/components/DiscoveryCard.astro` — discovery year / discoverer / country, plus name origin if present
- `src/components/BohrDiagram.astro` — pure SVG; takes `protons`, `neutrons`, `electrons_per_shell`; renders nucleus + concentric shells + electron dots per design spec; sized 320×320 by default
- `src/components/AttributionCaption.astro` — reads `.license.json` sidecar at build time and renders the required attribution line for `CC-BY*` images
- `src/components/PrevNextNav.astro` — bottom-of-page navigation: prev/next element by atomic number; "Periodic Table" link in middle
- `src/lib/bohr.ts` — pure function `electronShellGeometry(electrons_per_shell)` → array of `{ shell, radius, electrons: [{angle, x, y}] }` for SVG rendering
- `tests/unit/bohr.test.ts` — Vitest: shell geometry math (electron count per shell, even angular distribution)
- `tests/e2e/element-detail.spec.ts` — Playwright covering pipeline test below

### Components

(All listed in Files above — Astro components are inert except where noted; no React islands in this stage.)

## Interface Contracts

### Exposes

- **Element detail route** at `/elements/<symbol>` for all 118 elements (lowercase symbol)
- A reusable `<BohrDiagram>` component that other stages or future pages can use

### Consumes

- **Element Schema** (Stage 2) — `loadElement()` per page
- **Image Asset** (Stage 2) — primary image per element, license sidecar for attribution
- **Design Tokens** (Stage 1) — all visual properties

## Testing Requirements

- [ ] Vitest: `electronShellGeometry([2, 8, 18, 32, 32, 18, 4])` returns 7 shells, sum of electron count equals 114 (oganesson minus a few)
- [ ] Vitest: shell radii increase monotonically; electrons distributed evenly around each shell
- [ ] Playwright: `/elements/h` renders with "Hydrogen", "1.008 u", category "Nonmetal", Bohr diagram with 1 electron in 1 shell
- [ ] Playwright: `/elements/u` renders with "Uranium", electron config, all 7 detail cards
- [ ] Playwright: `/elements/og` (Oganesson, synthetic) renders without an image but with placeholder + "synthetic / no image" treatment
- [ ] Playwright: prev/next navigation: from `/elements/h`, "Next →" leads to `/elements/he`; from `/elements/he`, "← Prev" leads to `/elements/h`; from `/elements/og`, "Next →" is disabled or hidden
- [ ] Playwright: image with CC-BY-SA license has visible attribution caption below it
- [ ] Build produces 118 statically-rendered HTML files under `dist/server/pages/elements/`

## Pipeline Test: YES

Run a Playwright suite that:

1. Visits `/elements/h`, asserts hero contains "Hydrogen" and "1", asserts Bohr SVG has one `<circle>` electron
2. Visits `/elements/c` (Carbon), asserts ≥3 compounds listed
3. Visits `/elements/au` (Gold), asserts image renders + attribution caption present
4. Visits `/elements/og` (Oganesson), asserts placeholder image used, page still renders without errors
5. Visits 3 random elements (Fe, Hg, Xe), asserts no console errors and Bohr diagrams render

## Acceptance Criteria

- [ ] All 118 elements have a working detail page after `npm run build`
- [ ] Bohr diagrams render correctly: nucleus dot, concentric shells, evenly-spaced electrons, shell labels (K/L/M/N/O/P/Q)
- [ ] Hero, all 7 cards, image, attribution, prev/next render in design-spec layout (two-column desktop ≥1024px, single-column below)
- [ ] No console errors on any of the 118 pages (sample-checked in CI)
- [ ] Page weight per detail page is ≤ 150 KB total (HTML + CSS + image — image dominates)
- [ ] `getStaticPaths()` returns all 118 path entries
- [ ] Lighthouse Performance ≥ 90, Accessibility ≥ 95 on a sample detail page

## Dependencies

- Depends on: Stage 1 (foundation), Stage 2 (data), Stage 3 (landing — for prev/next link consistency, though technically this could parallel)
- Can parallel with: none (serialized)

## Notes

- **Bohr diagram details**: max practical shell count is 7 (oganesson). Use a slightly compressed radial scale at higher shell counts so the outer shells don't overflow the 320×320 viewBox. Electron-per-shell labels (K, L, …) sit just outside each shell at angle 270° (bottom).
- **Subscripts in formulae**: handle compound formulae that contain numbers (`H2O`, `Fe2O3`) by post-processing into `<sub>` tags in `CompoundsCard`. Use a small utility function — keep regex tight (only digit-runs after letters become subscript).
- **Synthetic / no-image elements**: when `image_primary` is null, render the `data/_placeholders/no-image.jpg` with a caption "Synthetic — no image available". Don't break layout.
- **Prev/Next** wraps cleanly at boundaries: `/elements/h` has no prev; `/elements/og` has no next. Disable (don't hide) those buttons for visual symmetry — render them as ghost-style with reduced opacity.
- The `<DetailCard>` wrapper can be used wholesale by Stage 6's embedded trivia widget — keep its API ergonomic.
