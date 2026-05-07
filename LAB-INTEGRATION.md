# Lab Integration — Handoff to the Chem-Lab-Game Agent

> **Audience:** the agent (and human) building **chem-lab-game** — a separate project that lives alongside this one.
> **Purpose:** describe what *Elements* is, what it exposes, and exactly how the Lab should plug in.
> **Status of this side:** Elements is **live in production** at <https://elements.seanmahoney.ai>. Repo: <https://github.com/seanerama/elements>.

---

## 1. What Elements is, in one paragraph

A static-first web encyclopedia of all 118 chemical elements + a light trivia game. Built with **Astro 5** (Node standalone adapter) + a few **React islands**. Aesthetic is "retro science" — vintage chemistry textbook palette + IBM Plex typography + Atomic-Age accents on interactive surfaces. Everything is deterministic and pre-rendered: 118 element detail pages, hover tooltips on the periodic table, embedded trivia widgets, two standalone trivia game pages. The data backing every page is committed JSON validated by Zod schemas at build time.

## 2. Where it lives & what it owns

| Thing | Where |
|---|---|
| Source repo | `github.com/seanerama/elements` (public, `main` is source-of-truth) |
| Live URL | `https://elements.seanmahoney.ai` |
| Deploy host | shared EC2 `t4g.small` at `34.207.137.224` (`seanmahoney-primary`) |
| App directory on host | `/home/ubuntu/apps/elements/` |
| PM2 process | `elements` (id 13, cluster mode, port `8011` bound to `127.0.0.1`) |
| Cloudflare Tunnel | `seanmahoney-primary` tunnel, public hostname `elements.seanmahoney.ai → http://localhost:8011` |
| CI/CD | `.github/workflows/{ci,deploy}.yml` — every push to `main` redeploys |

The host already runs ~13 PM2 apps. Adding the Lab is the same pattern (new directory under `/home/ubuntu/apps/`, new PM2 entry, new tunnel hostname). Full setup details: `~/seanmahoneyai/seanmahoney-ai-setup-guide.md`.

## 3. The bits the Lab will actually consume

Pick one or both of:

### 3a. The element data — **public, no API key, just HTTP**

Every element's data is served as static JSON at:

```
https://elements.seanmahoney.ai/data/elements/<symbol-lowercase>/data.json
```

Examples: `/data/elements/h/data.json`, `/data/elements/au/data.json`, `/data/elements/og/data.json`.

**Fetch from the Lab and you have everything:** atomic mass, density, melting/boiling points, electronegativity, electron config, oxidation states, occurrence, compounds, uses, reactivity summary. CC-BY-licensed images at `/data/elements/<symbol>/images/sample.jpg` with attribution sidecars at `/data/elements/<symbol>/images/sample.license.json`.

Cloudflare CDN caches these, so reads are cheap.

### 3b. The schema (canonical reference)

If the Lab wants type safety on the JSON above, mirror the Zod schema:

- **`src/types/element.ts`** — full `ElementSchema` (Zod) and inferred `Element` type
- **`sdd-output/contracts/element-schema.md`** — human-readable contract version

Easiest path: copy `src/types/element.ts` into the Lab as a read-only file. It has zero runtime deps beyond `zod`. **Do not invent your own schema** — re-using this one keeps both projects aligned if the schema bumps.

```typescript
// In the Lab:
import { ElementSchema, type Element } from '@/types/element';

const res = await fetch('https://elements.seanmahoney.ai/data/elements/mg/data.json');
const magnesium: Element = ElementSchema.parse(await res.json());
// magnesium.reactivity_summary, magnesium.compounds, etc.
```

### 3c. Compounds (cross-element references)

Each element's `data.json` has a `compounds[]` array — `{ formula, name, summary }`. The full union is also pre-built at:

```
https://elements.seanmahoney.ai/data/trivia/compound-questions.json
```

(That's the trivia bank, but it's effectively a denormalized list of every notable compound.) For Lab recipes that produce compounds (e.g. `Mg + O₂ → MgO`), use this to look up display names and summaries.

## 4. Visual language — drop-in retro science

If you want the Lab to feel like part of the same family:

```css
/* Lab can either copy this file or import it */
@import url('https://elements.seanmahoney.ai/styles/tokens.css');
```

…actually, `tokens.css` isn't currently exposed at a public URL — it's bundled into Astro's hashed CSS. The clean move is to **copy `src/styles/tokens.css` into the Lab repo verbatim** (it's a 100-line CSS-variables file, no deps). Same for `themes/retro-science.css`.

That gives you:
- 11 element category colors (`--color-cat-alkali-metal`, etc., with matching `*-tint` for fills)
- Atomic-Age accents (`--color-accent-vermillion`, `prussian`, `ochre`, `teal`) + darker `*-text` variants for AA-contrast text
- Type scale, spacing scale, border tokens, motion tokens

**Fonts:** IBM Plex Serif + Sans + Mono via `@fontsource/ibm-plex-{serif,sans,mono}`.

**The retro-science theme is calm and scholarly.** The Lab is allowed to feel different — louder, more game-y. Use the same tokens but feel free to:
- Layer additional accent colors (saturated reds for danger/heat, blues for cold, greens for inert)
- Add a Phaser-engine canvas with pixel sprites that contrast with the calm UI chrome
- Use heavier typography for game-state callouts

## 5. Cross-linking conventions

Elements uses these URL patterns. The Lab should respect them:

| Pattern | Example | Use case |
|---|---|---|
| `/elements/<symbol-lowercase>` | `/elements/au` | Single-element detail page |
| `/games/element` | `/games/element` | Trivia: guess the element |
| `/games/compound` | `/games/compound` | Trivia: guess the compound |

**Bidirectional integration plan** (both directions are optional but recommended):

- **Lab → Elements:** when a Lab recipe completes, render the products as links to `https://elements.seanmahoney.ai/elements/<symbol>`. Example: `Mg + O₂ → MgO` reveals "MgO (magnesium oxide). Magnesium [Mg ↗] · Oxygen [O ↗]."
- **Elements → Lab:** Elements has a placeholder page at `/lab` (currently a teaser). Once the Lab ships, replace its body with a real link/embed (or remove the page and have the nav link point at the live Lab URL — see § 8).

## 6. Deployment slot for the Lab

Reserve these now:

| Resource | Suggested value | Why |
|---|---|---|
| App dir | `/home/ubuntu/apps/chem-lab-game/` | Matches the convention from the setup guide |
| PM2 process name | `chem-lab-game` | Discoverable in `pm2 list` |
| Local port | `8012` | Next in the user's stated 8009+ range; 8011 is taken by Elements |
| Public URL | `lab.seanmahoney.ai` (subdomain) **or** `elements.seanmahoney.ai/lab` (subpath) | See § 8 |
| Tunnel route | Add via Zero Trust dashboard: `lab.seanmahoney.ai → http://localhost:8012` | Same pattern as Elements |
| Repo | new GitHub repo `seanerama/chem-lab-game` (per user) | Separate so iteration speed isn't coupled |

## 7. Recommended Lab tech stack (so we stay coherent)

These are suggestions to keep both projects in the same universe of tooling. The Lab agent can override any of them.

| Concern | Suggestion |
|---|---|
| Bundler | **Vite** (Astro uses Vite under the hood — same DX) |
| Game engine | **Phaser 3** for sprite + scene + tween primitives, OR **PixiJS** if you want lower-level control |
| UI chrome (menus, ingredient tray) | Plain TypeScript + the tokens above. No need for React unless the Lab grows complex |
| Language | TypeScript strict |
| Testing | Vitest (unit) — Phaser/canvas E2E is hard to make reliable, so prefer unit tests on pure recipe logic |
| Process manager | PM2 (matches existing infra) |
| Deploy CI | Mirror Elements' `.github/workflows/deploy.yml` — adapt paths and process name |

## 8. The `/lab` page on Elements — what to do when the Lab ships

Right now `src/pages/lab.astro` is a placeholder that teases the project (3 sample reactions: combustion, acid–base, precipitation). When the Lab is ready, **pick one** of these:

### Option A — Subdomain (recommended)
- Lab lives at `lab.seanmahoney.ai`
- On Elements, replace `/lab` page body with a one-line redirect/CTA to `https://lab.seanmahoney.ai`
- Keep the `The Lab` nav link, but point it at the absolute URL
- **Why preferred:** clean separation, each project has its own root, no proxy gymnastics

### Option B — Subpath
- Lab lives at `elements.seanmahoney.ai/lab`
- Cloudflare Tunnel route for hostname `elements.seanmahoney.ai` would need a path-based rule (Cloudflare Tunnel supports this; see Zero Trust → Networks → Tunnels → Public Hostname → Path field)
- Elements' `/lab` page is **deleted** (the tunnel routes the path away from Elements before it reaches the Astro server)
- **Why second-choice:** deeper integration but trickier ops — the tunnel rule needs precedence over Elements' catch-all

When the Lab is ready, delete or rewrite `src/pages/lab.astro` accordingly. The nav link is in 5 page files (`src/pages/{index,games/index,games/element,games/compound,elements/[symbol]}.astro`); `grep -l '/lab' src/pages` finds them all.

## 9. Strawman recipe schema (for the Lab to extend)

To keep recipes readable and stable, here's a starting JSON shape. The Lab agent should treat this as a *suggestion* and refine.

```typescript
interface Recipe {
  id: string;                      // "mg-combustion-001"
  name: string;                    // "Magnesium combustion"
  difficulty: 'intro' | 'easy' | 'medium' | 'hard';
  inputs: Array<{
    species: string;               // element symbol "Mg" or compound formula "HCl"
    state?: 'solid' | 'liquid' | 'gas' | 'aqueous' | 'powder';
    amount?: number;               // arbitrary units; engine decides what they mean
  }>;
  conditions: Array<{
    op: 'heat' | 'chill' | 'dilute' | 'mix' | 'wait' | 'ignite' | 'electrify';
    parameter?: number;            // e.g. heat target temp in Celsius
    durationMs?: number;
  }>;
  output: Array<{
    species: string;               // "MgO"
    state?: 'solid' | 'liquid' | 'gas' | 'aqueous' | 'powder';
    visual?: string;               // sprite key for the result
    elementsLinked?: string[];     // ["Mg", "O"] — drives the deep-link list
  }>;
  description: string;             // shown after success: "Magnesium ribbon ignites with a brilliant white flame…"
  citations?: Array<{ source: string; url?: string }>;
}
```

5 starter recipes worth more than phase changes:

1. `Mg + O₂ → MgO` (combustion, dramatic flash)
2. `HCl + NaOH → NaCl + H₂O` (acid–base neutralization)
3. `AgNO₃ + NaCl → AgCl↓ + NaNO₃` (precipitation, cloudy white solid)
4. `Fe + S → FeS` (heated synthesis, glow)
5. `2H₂O₂ → 2H₂O + O₂` (decomposition with catalyst, foam)

## 10. Open questions to resolve before writing Lab code

These are the decisions that will most shape the Lab. Resolve them with the user *before* committing to a stack:

1. **URL placement** — subdomain (`lab.seanmahoney.ai`) or subpath (`elements.seanmahoney.ai/lab`)? Picks pin the tunnel + nav-link work.
2. **Element data freshness** — fetch live from `elements.seanmahoney.ai/data/...` (always current, depends on Elements being up) or vendor a copy at Lab build time (pinned, but goes stale)? Both are valid; pick one.
3. **Sprite source** — hand-drawn (Aseprite), AI-generated (the user has used Nano Banana / PixelLab in the past), or commissioned? Sprite production is the long pole.
4. **Game shape** — single-screen "workbench" puzzle (5 recipes, complete-them-all), or campaign progression (unlock recipes by mastering simpler ones)?
5. **Persistence** — localStorage only (matches Elements' trivia engine), or eventually a per-user account leveraging the existing OAuth server at `auth.seanmahoney.ai`?

## 11. Don'ts

A few things to avoid that I learned the hard way on Elements:

- **Don't `output: 'static'` + `loadAllElements()` from `src/lib`** — Vite bundles `import.meta.url` so file paths break at SSG time. Use `process.cwd()` for repo-root-relative reads. (See `src/lib/elements.ts` for the working pattern.)
- **Don't `client:visible` for islands the user is likely to interact with quickly** — the JS doesn't load until scroll, and clicks before hydration silently no-op. Use `client:load` for the orbital toggle / trivia widget pattern. (We made this mistake; user reported "click does nothing.")
- **Don't `grep -q` in `set -o pipefail` smoke checks** — `grep -q` exits early on match, SIGPIPE on the writer, pipefail flags the whole pipe as failed. Use `grep -cF` and check the count. (Bit us in `scripts/post-deploy-smoke.sh`.)
- **Don't put role="grid" on the periodic table wrapper** — axe rejects `<a>` children of `role="grid"` (they need `role="gridcell"`). The wrapper just needs `aria-label`; the cells are anchors with their own labels.
- **Don't run pipelines (`npm run data:build`) in CI** — it spends sub-agent + image-API credits. The scripts are guarded by `ALLOW_DATA_BUILD=1`. Local-only by design.

## 12. Files & dirs the Lab agent will reference most

When you start, read these in order:

1. **This file** — you're here.
2. `sdd-output/contracts/element-schema.md` — the binding contract for element JSON.
3. `sdd-output/contracts/image-asset.md` — image filename conventions + license rules.
4. `src/types/element.ts` — the Zod schema in code (copy into the Lab).
5. `src/styles/tokens.css` — the design tokens (copy into the Lab).
6. `~/seanmahoneyai/seanmahoney-ai-setup-guide.md` — infra conventions (deploy paths, tunnel setup, PM2 patterns).
7. `sdd-output/tests/deploy-runbook.md` — what a deploy looks like operationally.

Skim, don't read end-to-end:
- `src/pages/elements/[symbol].astro` — example of how Elements consumes the schema, including the prev/next nav and the trivia widget integration.
- `src/lib/elements.ts` — example of the loader pattern (and the `process.cwd()` gotcha).

Ignore:
- `pipelines/` — these only run on the developer machine, never in production. The Lab doesn't need to re-run them.

---

## TL;DR for the Lab agent

1. Build at <https://github.com/seanerama/chem-lab-game> (new repo). Stack: Vite + Phaser 3 + TypeScript.
2. Element data: fetch JSON from `https://elements.seanmahoney.ai/data/elements/<sym>/data.json`. Validate with the `ElementSchema` you copy from this repo.
3. Visual language: copy `src/styles/tokens.css` and `src/styles/themes/retro-science.css` from this repo verbatim, then add Lab-specific overrides as needed.
4. Deploy: same pattern as Elements — `/home/ubuntu/apps/chem-lab-game/`, port 8012, PM2 process `chem-lab-game`, Cloudflare Tunnel route `lab.seanmahoney.ai → http://localhost:8012`.
5. Cross-link: every recipe output links back to `https://elements.seanmahoney.ai/elements/<symbol>`. When Lab ships, the user updates Elements' `/lab` page (and nav link) to point at `lab.seanmahoney.ai`.
6. **Resolve § 10 questions with the user first.**
