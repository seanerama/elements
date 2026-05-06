# Project Plan: Elements

**Version**: 0.1.0
**Created**: 2026-05-06
**Lead Architect**: LA Session
**Vision Lead**: smahoney
**Public URL**: https://elements.seanmahoney.ai

## Overview

**Elements** is an interactive, browseable web encyclopedia of the periodic table. The landing page is the periodic table itself; users hover for quick-look summaries, filter by category, and click into rich per-element detail pages with electron-shell diagrams, optional 3D orbital visualizations, real-world imagery, and embedded "test yourself" trivia. A standalone `/games` section hosts two trivia modes (guess-the-element, guess-the-compound). All 118 elements ship with full content. Aesthetic is retro-science with a token-driven theme system for later swaps.

The site is overwhelmingly static content — 118 pre-renderable element pages plus a handful of interactive zones. We exploit that with Astro's islands architecture: zero client JS by default, with React islands hydrating only where interactivity is required.

## Tech Stack

| Layer                  | Technology                                  | Rationale |
|------------------------|---------------------------------------------|-----------|
| Framework              | **Astro 5** (`@astrojs/node`, standalone)   | Static-first, ships ~0 KB JS for static content, islands architecture matches the few interactive zones, Node adapter preserves the user's existing EC2 + PM2 + Cloudflare-Tunnel pattern |
| Interactive islands    | **React 18** (`@astrojs/react`)             | Mature, ecosystem fit for Three.js, Fuse.js, trivia state. Hydrated only where needed |
| Language               | **TypeScript** (strict)                     | Type safety across data pipeline, components, and trivia engine |
| Styling                | **CSS custom properties + CSS Modules**     | Token-driven themes, scoped component styles, no runtime CSS-in-JS overhead |
| 2D visualizations      | **Inline SVG** (component-rendered)         | Bohr/electron-shell diagrams: lightweight, retro-poster aesthetic, generated from electron config |
| 3D visualization       | **Three.js** + `@react-three/fiber`         | Optional orbital viz behind a "View 3D" toggle on element pages — bundle loaded lazily only when toggled |
| Search                 | **Fuse.js** (client-side)                   | 118 elements is tiny; ship index in-page, instant fuzzy search, no backend |
| Data storage           | **Static JSON files** (`data/elements/<symbol>/data.json`) | Built once via data pipeline, committed to repo, shipped as static assets |
| Testing — unit         | **Vitest**                                  | Fast, native TS/ESM, covers `lib/`, data pipeline, trivia generators |
| Testing — E2E          | **Playwright**                              | Golden-path flows (table → element → games), cross-browser |
| Lint / format          | **ESLint** (Astro + React) + **Prettier**   | Standard Astro project setup |
| Process manager        | **PM2** (on EC2)                            | Matches existing infra pattern across other apps |
| Hosting                | **AWS EC2** behind **Cloudflare Tunnel**    | User-mandated; tunnel removes need for nginx, public IP, or open ports |
| Auth                   | **None** (v1)                               | Public reference site; no user accounts in MVP |
| Database               | **None** (v1)                               | All data is static; trivia state in localStorage |

## Architecture

### Philosophy

- **Static-first**: every element page, every game page is pre-rendered at build time.
- **Islands of interactivity**: React only hydrates components that *need* state (search box, table hover/filter, 3D viz, trivia widget). Bohr diagrams render as inert SVG.
- **Build-time data, runtime serving**: per-element data and images are assembled by a manual pipeline (sub-agents + Nano Banana Pro), committed to the repo, and served as static assets. The Node server is essentially a static-asset server with the option to add API routes later.
- **Theme via tokens**: all visual properties (color, font, spacing, border, shadow) defined as CSS custom properties. A theme = one stylesheet. Switching themes = setting `data-theme="<name>"` on `<html>`.

### System Diagram

```
                   ┌─────────────────────────────────────┐
                   │         Browser (Desktop-first)     │
                   │  - Static HTML/CSS                  │
                   │  - React islands (lazy-hydrated)    │
                   │  - localStorage (trivia scores)     │
                   └────────────────┬────────────────────┘
                                    │ HTTPS
                                    ▼
                  ┌─────────────────────────────────────┐
                  │      Cloudflare (DNS + Edge)        │
                  │  - DNS: elements.seanmahoney.ai     │
                  │  - SSL termination                  │
                  │  - CDN cache (static assets)        │
                  │  - DDoS / WAF                       │
                  └────────────────┬────────────────────┘
                                   │ Cloudflare Tunnel
                                   ▼
              ┌────────────────────────────────────────────┐
              │   AWS EC2 (existing instance)              │
              │   ┌────────────────────────────────────┐   │
              │   │ cloudflared (existing process)     │   │
              │   │   route: elements.seanmahoney.ai   │   │
              │   │      → http://localhost:8011       │   │
              │   └────────────────┬───────────────────┘   │
              │                    │                       │
              │   ┌────────────────▼───────────────────┐   │
              │   │ PM2 — process: 'elements'          │   │
              │   │   ┌────────────────────────────┐   │   │
              │   │   │ Astro Node Server (8011)   │   │   │
              │   │   │  dist/server/entry.mjs     │   │   │
              │   │   │  serves: SSG'd pages +     │   │   │
              │   │   │          static assets +   │   │   │
              │   │   │          /data/elements/*  │   │   │
              │   │   └────────────────────────────┘   │   │
              │   └────────────────────────────────────┘   │
              └────────────────────────────────────────────┘
                                   ▲
                                   │ rsync/ssh deploy
                  ┌────────────────┴────────────────────┐
                  │   GitHub Actions (CI)               │
                  │   - npm ci                          │
                  │   - npm run build                   │
                  │   - rsync dist/ → EC2:/var/www/...  │
                  │   - ssh: pm2 reload elements        │
                  └─────────────────────────────────────┘

   Build-time-only (developer machine, not CI):
   ┌─────────────────────────────────────────────────────┐
   │  Data Pipeline (manual: `npm run data:build`)       │
   │   - Sub-agents fetch per-element data from web      │
   │   - Nano Banana Pro / Wikimedia for images          │
   │   - Outputs to data/elements/<symbol>/              │
   │   - Generates trivia question bank                  │
   │   - All output committed to repo                    │
   └─────────────────────────────────────────────────────┘
```

## Features

### Core Features (MVP)

1. **Periodic Table Landing** — All 118 elements rendered in standard layout, color-coded by category. Hover quick-look tooltip per cell. Click a category legend to filter/highlight that group.
2. **Element Detail Pages** — One per element (118 total, all with real content): core data, occurrence/states, notable compounds, uses, reactivity, electron configuration, discovery, SVG Bohr diagram, optional 3D orbital toggle, real-world imagery, embedded trivia widget.
3. **Search** — Client-side fuzzy search by name, symbol, or atomic number. Results dropdown with deep links to element pages.
4. **Group Filter** — Click a category (noble gases, alkali metals, halogens, etc.) on the landing page to highlight/filter the table.
5. **Trivia Games (`/games`)** — "Guess the Element" and "Guess the Compound" modes. Question bank auto-derived from element data at build time.
6. **Embedded Trivia Widgets** — "Test yourself" mini-quiz on each element detail page using questions specific to that element.
7. **Theme System** — Retro-science as the shipped default; architecture supports additional themes via a single CSS file + `data-theme` switch.

### Future Features (Post-MVP)

- Side-by-side element comparison
- Mobile-optimized layout
- Additional themes (dark museum, textbook, etc.)
- Hand-curated trivia question pool
- User accounts / persistent scores / leaderboards
- Curated learning paths / lesson modules
- Internationalization
- Element history / discovery timelines

## Project Structure

```
elements/
├── astro.config.mjs                # Astro config (node adapter, integrations)
├── package.json
├── tsconfig.json
├── ecosystem.config.cjs            # PM2 config (deploy target)
├── .env.example                    # Documented env vars (NO secrets committed)
├── .github/
│   └── workflows/
│       └── deploy.yml              # CI: build + rsync + pm2 reload
├── data/                           # COMMITTED static data (built once, then versioned)
│   ├── elements/
│   │   ├── h/                      # Hydrogen
│   │   │   ├── data.json
│   │   │   └── images/
│   │   │       ├── sample.jpg
│   │   │       └── compound-water.jpg
│   │   ├── he/
│   │   └── ...                     # 118 element folders, lowercase symbol
│   ├── compounds.json              # Cross-element compound index
│   └── trivia/
│       ├── element-questions.json
│       └── compound-questions.json
├── pipelines/                      # Build-time data scripts (NOT in CI)
│   ├── README.md                   # How to run, what each script does
│   ├── fetch-element-data.ts       # Sub-agent driver: web research per element
│   ├── source-images.ts            # Wikimedia + Nano Banana Pro orchestration
│   └── build-trivia.ts             # Generates question banks from element data
├── src/
│   ├── components/
│   │   ├── PeriodicTable.astro     # Static SVG/grid layout
│   │   ├── ElementCell.astro
│   │   ├── HoverTooltip.tsx        # React island
│   │   ├── GroupFilter.tsx         # React island
│   │   ├── SearchBox.tsx           # React island (Fuse.js)
│   │   ├── BohrDiagram.astro       # Inert SVG
│   │   ├── OrbitalViz.tsx          # React island, lazy-loaded Three.js
│   │   ├── TriviaWidget.tsx        # React island
│   │   └── ThemeRoot.astro
│   ├── pages/
│   │   ├── index.astro             # Periodic table landing
│   │   ├── elements/[symbol].astro # SSG via getStaticPaths
│   │   ├── games/
│   │   │   ├── index.astro
│   │   │   ├── element.astro
│   │   │   └── compound.astro
│   │   └── about.astro
│   ├── layouts/
│   │   └── BaseLayout.astro
│   ├── styles/
│   │   ├── tokens.css              # CSS custom property definitions
│   │   ├── base.css                # Reset, typography
│   │   └── themes/
│   │       └── retro-science.css   # Default theme
│   ├── lib/
│   │   ├── elements.ts             # Data loaders, types
│   │   ├── search.ts               # Search index builder
│   │   ├── trivia-engine.ts        # Game logic (pure)
│   │   └── electron-config.ts      # Bohr/shell calculation
│   └── types/
│       └── element.d.ts            # Element schema (single source of truth)
├── public/
│   └── favicon.svg
├── tests/
│   ├── unit/
│   │   ├── electron-config.test.ts
│   │   ├── trivia-engine.test.ts
│   │   └── search.test.ts
│   └── e2e/
│       ├── landing.spec.ts
│       ├── element-detail.spec.ts
│       └── games.spec.ts
├── playwright.config.ts
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc
└── README.md
```

## Cross-Cutting Standards

### Logging

- **Build-time pipelines**: Pino structured JSON logging to stdout. Levels: `info` (progress), `warn` (recoverable), `error` (failure). Each element fetched logs a single line on success.
- **Server-side (Astro Node)**: Default Astro logging. Pino added if/when API routes are introduced.
- **Client-side**: `console.warn` / `console.error` only. No third-party telemetry/analytics in MVP.

### Error Handling

- **Build-time**: Hard-fail on any element data fetch failure. Better to know during build than ship a broken page.
- **Pipeline retries**: Each sub-agent fetch retries up to 3× with exponential backoff before failing.
- **Server runtime**: Astro's built-in 404/500 pages, customized to the retro-science theme.
- **Client interactive components**: React error boundaries around the 3D viz and trivia widget. If they fail, the rest of the page must remain usable.

### Authentication

**None for v1.** No user accounts, no sessions, no auth middleware. All trivia state is ephemeral / localStorage. Architecture decision documented for future expansion: any auth additions should sit at the API-route layer (Astro endpoints), not in the page layer.

### Code Style

- **TypeScript strict mode** (`strict: true`, `noUncheckedIndexedAccess: true`).
- **ESLint**: Astro + React + TypeScript presets, `no-explicit-any: error`.
- **Prettier**: 2-space indent, single quotes, trailing commas, 100-char line width.
- **Naming**: `PascalCase` components, `camelCase` functions/vars, `SCREAMING_SNAKE_CASE` constants, `kebab-case` files (except components which match the component name).
- **No barrel files** for utility modules (deep imports only) — keeps tree-shaking clean.

### Testing

- **Vitest** for unit tests on `lib/` (electron config, search, trivia engine) and `pipelines/`. Target: 80%+ coverage on `lib/`.
- **Playwright** for E2E covering: landing-page render, hover tooltip, category filter, click-to-element, search, both game modes, embedded trivia widget. Run on Chromium only in CI (Firefox/Webkit can be added later).
- **Visual regression** is out of scope for MVP.

### Versioning

- **Semver**, starting at **0.1.0**.
- Bumped manually in `package.json` at meaningful milestones.
- Tag releases in git after each deploy.

## Data Pipeline

The data pipeline is the most novel part of the architecture. It runs **manually** on a developer machine (not in CI) and outputs are **committed to the repo**.

### Element Data (`pipelines/fetch-element-data.ts`)

- Iterates a hard-coded list of all 118 elements.
- For each: spawns a sub-agent with a tightly-scoped prompt to gather: physical properties, occurrence/states, isotopes summary, notable compounds, common uses, reactivity, electron configuration, discovery (year, person, source), and a structured citations list.
- Sub-agent output validated against a strict TypeScript schema (Zod) before write.
- Output: `data/elements/<symbol>/data.json`, schema versioned.

### Images (`pipelines/source-images.ts`)

- For each element: attempts Wikimedia Commons API first (CC-BY/CC-BY-SA/PD only), records license metadata.
- If no acceptable image found: falls back to Nano Banana Pro generation with a structured prompt template.
- All images stored at `data/elements/<symbol>/images/` with a sidecar `license.json` recording source/license/attribution.

### Trivia Bank (`pipelines/build-trivia.ts`)

- Reads all element JSON files.
- Generates N templated questions per element (e.g. "What's the symbol for X?", "Identify this element from its photo", "Which element has electron configuration Y?").
- Outputs to `data/trivia/element-questions.json` and `data/trivia/compound-questions.json`.

## Deployment Strategy

**Target**: AWS EC2 (existing instance) → Cloudflare Tunnel → `elements.seanmahoney.ai`

**Process model**: PM2-managed Node process running Astro's standalone Node server on **port 8011** (chosen from the user's available 8009+ range).

**Deploy flow**: GitHub Actions builds, rsyncs `dist/` and runtime deps to EC2, runs `pm2 reload elements` for zero-downtime restart. (Full step-by-step in `deploy-instruct.md`.)

**No nginx, no public ports**: Cloudflare Tunnel handles ingress. The Node server binds to `127.0.0.1:8011` only.

## Secrets Management

**.env-driven**, no secrets in git. The committed `.env.example` documents:

| Variable                     | Purpose                                          | Required at |
|------------------------------|--------------------------------------------------|-------------|
| `PORT`                       | Astro server bind port (default 8011)            | Runtime     |
| `HOST`                       | Bind address (default 127.0.0.1)                 | Runtime     |
| `NODE_ENV`                   | `production` on EC2, `development` locally       | Runtime     |
| `NANO_BANANA_API_KEY`        | Nano Banana Pro image generation                 | Pipeline only |
| `WIKIMEDIA_USER_AGENT`       | Required by Wikimedia API                        | Pipeline only |

Pipeline secrets never leave the developer machine. Runtime secrets on EC2 live in PM2's ecosystem config or a dedicated `.env` (excluded from `.gitignore`'s `sdd-output/` rule — needs explicit `.env` exclusion already in place).

## Initial Version

**0.1.0** — set in `package.json` at project init.
