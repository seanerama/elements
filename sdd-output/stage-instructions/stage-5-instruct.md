# Stage 5: 3D Orbital Visualization

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Add an optional 3D orbital visualization to each element detail page
- Implement as a React island that lazy-loads Three.js + `@react-three/fiber` only when the user clicks "View 3D"
- Verify Three.js is **not** in the initial detail-page bundle
- Provide a useful (not just decorative) visualization: rotating atomic structure with shells and orbiting electrons, color-coded per design tokens

## What to Build

### Files

- `package.json` additions: `three`, `@react-three/fiber`, `@react-three/drei` (for OrbitControls, Html, etc.) — placed in `dependencies` (not devDependencies)
- `src/components/OrbitalToggle.tsx` — React island, `client:visible`; renders the `[ View 3D Orbital ▶ ]` button per design spec; on click, dynamically imports `OrbitalViz` and reveals it
- `src/components/OrbitalViz.tsx` — React component (loaded lazily by `OrbitalToggle`); renders a Three.js scene via R3F; takes the same `protons`, `neutrons`, `electrons_per_shell` props as `BohrDiagram`
- `src/components/orbital-viz/Atom.tsx` — the actual Three.js scene: nucleus sphere with proton/neutron count badge (Drei `Html` component), concentric shell rings, animated orbiting electron spheres
- `src/components/orbital-viz/Loading.astro` — small inert "RENDERING…" loading state per design spec
- `src/lib/orbital-geometry.ts` — pure function `orbitalsForShells(electrons_per_shell)` → scene config (radii, electron orbit speeds, colors)
- `tests/e2e/orbital-viz.spec.ts` — Playwright: clicking toggle reveals canvas; canvas has non-zero size; bundle audit confirms Three.js is in a separate chunk

### Components

- `OrbitalToggle.tsx` — small island that owns the toggle state and triggers lazy import
- `OrbitalViz.tsx` — heavy island, lazy-loaded only

## Interface Contracts

### Exposes

- A toggleable 3D viz on every `/elements/<symbol>` detail page
- A reusable scene generator (`src/lib/orbital-geometry.ts`) that future stages could use

### Consumes

- **Element Schema** (Stage 2) — `electrons_per_shell` from element data
- **Design Tokens** (Stage 1) — colors used in the Three.js scene must match `--color-accent-prussian` (electrons), `--color-ink` (nucleus), `--color-rule` (shells). Tokens read once at component init via `getComputedStyle(document.documentElement)`

## Testing Requirements

- [ ] Bundle audit: built output's main element-detail page JS chunk does NOT contain `three` (verify via `find dist/client -name "*.js" | xargs grep -l "THREE"` returning empty for non-orbital chunks)
- [ ] Bundle audit: lazy-loaded chunk that includes Three.js exists and is gzipped ≤ 250 KB
- [ ] Playwright: visit `/elements/h`, assert main JS bundle does not request a `three`-containing chunk
- [ ] Playwright: click "View 3D Orbital" → observe network request for chunk → assert canvas rendered (`<canvas>` element present, `width > 0`)
- [ ] Playwright: click toggle on `/elements/u` (uranium, 7 shells) → assert canvas renders without errors
- [ ] Playwright: with `prefers-reduced-motion: reduce`, electron animation slows or stops (still renders, just static)
- [ ] Vitest: `orbitalsForShells([2, 8, 18, 32, 32, 18, 4])` returns 7 shell configs with expected radii ratios

## Pipeline Test: YES

Pipeline-level test in Playwright:

1. Navigate to `/elements/c`
2. Capture network log of all JS chunks loaded
3. Assert no chunk contains `three.js` payload (via response size heuristic + URL inspection)
4. Click `[data-testid="orbital-toggle"]`
5. Assert a new chunk is fetched (network log delta) and contains Three.js
6. Wait for canvas: `await page.waitForSelector('canvas', { state: 'visible' })`
7. Assert canvas has non-zero dimensions
8. Snapshot test: take a screenshot of the canvas region for visual regression baseline

## Acceptance Criteria

- [ ] 3D viz works on a sample of 5 elements (small/medium/large shell counts: H, C, Fe, Au, U)
- [ ] Three.js bundle is split and lazy-loaded — confirmed via build output inspection
- [ ] Toggle button matches design spec (teal accent, Cube icon)
- [ ] No console errors on toggle or render
- [ ] Animation is calm (slow rotation, gentle electron orbit speed) — no flicker or jank
- [ ] Reduced-motion preference respected
- [ ] Tokens-from-CSS approach: changing the theme also affects the 3D scene's colors at runtime

## Dependencies

- Depends on: Stage 4 (detail pages must exist)
- Can parallel with: none (serialized)

## Notes

- **Don't over-design the visualization.** Goal is "interesting at-a-glance" not "scientifically accurate orbital geometry." Concentric shell rings with orbiting electron dots are fine — quantum orbital shapes (s, p, d, f) are beautiful but a major additional scope and probably better as a post-MVP enhancement.
- **Three.js is heavy.** Resist the urge to add particles, lighting, post-processing. A clean scene with shell rings, a sphere nucleus, and a small handful of orbiting electrons looks better and ships faster.
- **Tokens-to-Three.js bridge**: read `getComputedStyle(document.documentElement).getPropertyValue('--color-accent-prussian')` once at scene init and pass to material color. Theme changes after init don't re-color the live scene (that's fine for MVP — note as future enhancement).
- **R3F Canvas** must have `dpr={[1, 2]}` for sharp rendering on retina without absurd cost on huge displays.
- Use Drei's `OrbitControls` so users can drag to rotate, scroll to zoom. Lock pan and zoom limits to keep the viz centered.
- **Verify the bundle split** with `npx vite-bundle-visualizer` or by inspecting `dist/client/_astro/` for the chunked filenames. Don't just trust Vite's defaults.
