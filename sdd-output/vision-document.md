# Vision Document: Elements

**Created**: 2026-05-06
**Vision Lead**: smahoney

## The Idea

**Elements** is an interactive, browseable web encyclopedia of the periodic table — a "digital museum exhibit" that turns the periodic table itself into the navigation surface. Users land on the full table, hover any cell for a quick-look summary, click a category (noble gases, alkali metals, halogens, etc.) to filter to a group, or click an element to open a rich detail page covering states, compounds, uses, reactivity, electron structure, and visual references. The aesthetic is **retro science** — vintage-poster typography and palette — with a theme system so the look-and-feel can be swapped later. Light gamification (trivia mini-games) lives both as a standalone section and as embedded "test yourself" widgets on element pages.

## Problem Statement

Existing periodic-table references on the web fall into two camps: dry data tables (hard to enjoy, hard to explore) and pretty-but-shallow visualizations (great-looking, but you can't actually learn from them). There isn't a destination that is simultaneously *visually distinctive*, *deep enough to satisfy curiosity*, and *fun to wander through* — somewhere a curious adult or a student can spend 20 minutes clicking around and come away having actually learned something. **Elements** fills that gap.

This is also a **portfolio piece**: a non-trivial frontend project demonstrating data pipeline design, rich interactive UX, theming, AI-assisted asset generation, and sensible hosting/deployment.

## Target Users

**Primary**
- Curious adults — hobbyist science readers, browsers, "I just want to fall down a rabbit hole" users
- Students (middle school through early college) using it as a supplementary reference

**Secondary**
- Recruiters / hiring managers evaluating the project as a portfolio piece
- Educators looking for a visually engaging classroom reference

## Success Criteria

- [ ] All 118 elements have a full detail page (no placeholders) covering at minimum: physical properties, occurrence/states, notable compounds, uses, reactivity, electron configuration, discovery
- [ ] Periodic table landing page renders correctly desktop-first with hover tooltips on every cell
- [ ] Group filtering (noble gases, alkali metals, halogens, transition metals, lanthanides, actinides, metalloids, post-transition metals, alkaline earth) works from the landing page
- [ ] Search by name, symbol, or atomic number returns instantly
- [ ] Each element page includes visual content: Bohr/electron-shell diagram, atomic structure visualization, and at least one real-world image (sample/ore/gas canister/compound)
- [ ] Two trivia game modes work: "guess the element" and "guess the compound," accessible from a `/games` section AND embedded as a "test yourself" widget on element pages
- [ ] Theme system is in place — retro-science is the shipped default, but switching themes does not require code changes (config/CSS-token driven)
- [ ] Site is deployed to AWS EC2 fronted by Cloudflare and reachable at a public URL
- [ ] Portfolio-quality polish: smooth interactions, no broken images, reasonable load performance on desktop

## Core Concepts

- **Element** — one of the 118 chemical elements. Each has a dedicated page and a folder of data + images.
- **Group / Category** — visual subset of the table (noble gases, alkali metals, etc.) used as the primary filter dimension.
- **Element Folder** — per-element directory (`data/elements/<symbol>/`) containing structured JSON data and a curated set of images. Built once at *build time* by sub-agent data pipeline, committed to the repo, and shipped as static assets.
- **Quick-Look Tooltip** — hover state on the table; shows name, symbol, atomic number, atomic mass, category color.
- **Detail Page** — full per-element page; the deepest content surface in the app.
- **Trivia Mode** — gamified self-test, both standalone (`/games`) and embedded on element pages.
- **Theme** — swappable visual skin built on CSS tokens / design system; retro-science is v1 default.

## Scope (MVP)

### In Scope

**Navigation & Structure**
- Periodic table landing page (all 118 elements visible, color-coded by category)
- Hover quick-look tooltip per element
- Click a category to filter/highlight that group
- Click an element to open detail page
- Search bar (name / symbol / atomic number)

**Element Detail Page (all 118)**
- Core data: atomic number, mass, symbol, name, category, period, group, electron configuration, discovery
- Naturally occurring states / phase at STP / isotopes (high-level)
- Notable compounds
- Common uses
- Reactivity / chemical behavior
- Visualizations: Bohr/electron-shell diagram, atomic structure (3D or 2D rendering)
- Imagery: at least one real-world photo (sample/ore/gas canister/compound) — sourced from web or generated via Nano Banana Pro
- Embedded "test yourself" trivia widget

**Games Section (`/games`)**
- "Guess the Element" mode
- "Guess the Compound" mode

**Aesthetic & Theming**
- Retro-science theme as v1 default
- Theme system architected so additional themes can be added later without code changes (token/config-driven)

**Data Pipeline**
- Build-time sub-agent pipeline: pulls per-element data from the web, generates/sources images, writes per-element folders. Run once, commit results, ship statically.

**Deployment**
- AWS EC2 with Cloudflare in front
- Desktop-first responsive (no mobile-specific work in MVP)

### Out of Scope (v1)

- Side-by-side element comparison
- Mobile-optimized layouts (desktop-first; tablet/phone is post-MVP)
- User accounts / saved progress / leaderboards
- Additional themes beyond retro-science (architecture supports them; only one is shipped)
- Live/runtime data fetching (data is static after build)
- Internationalization / non-English content
- Accessibility audit beyond reasonable defaults (revisit post-MVP)
- Curated learning paths / lesson plans
- Element history timelines, periodic-table-history exhibit content

## Open Questions

These are decisions the **Lead Architect** and **UI/UX Designer** can resolve in the next phase — flagged here so they aren't lost:

- **Frontend framework choice** (Next.js vs Astro vs vanilla — architect's call; static-site-friendly stacks are favored given build-time data pipeline)
- **3D atomic visualization** — full WebGL/Three.js per element, or a lighter SVG/canvas approach? (perf vs fidelity tradeoff)
- **Image licensing** — for web-sourced photos, what licensing standard do we hold to? (Public-domain / CC-BY only, or also fair-use educational?) Affects pipeline.
- **Trivia question pool size** — does each element generate N auto-derived questions, or is there a hand-curated bank?
- **Game scoring/state** — purely ephemeral per-session, or persisted (would imply auth, currently out of scope)?
- **Build pipeline location** — does the per-element data subagent run as part of project setup (one-time) or as a CI step?
- **EC2 instance shape** — for a static-asset-heavy site behind Cloudflare, the EC2 box mostly serves files; is there a server-side need we haven't surfaced (e.g., trivia API)?

## Constraints

- **Technical**:
  - Must deploy to **AWS EC2** fronted by **Cloudflare** (hosting choice is fixed)
  - Per-element data + images must be assembled at **build time** via sub-agents and shipped statically (not fetched at runtime)
  - Theme system must be **token/config-driven** so themes can be swapped without code changes
  - **Desktop-first**; mobile not required for MVP
- **Budget**: Personal/portfolio project — keep AWS spend modest (right-size EC2, lean on Cloudflare caching). Image generation via Nano Banana Pro is acceptable cost.
- **Timeline**: No hard deadline — portfolio quality matters more than speed.
- **Other**:
  - Content accuracy matters (chemistry data must be correct; cite/source where reasonable)
  - All 118 elements must ship with real content — no placeholder pages
