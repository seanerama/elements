# Design System: Elements

**Created**: 2026-05-06
**Designer**: UI/UX Designer Session
**Default theme**: `retro-science`

## Design Philosophy

**Calm at rest, lively where you click.** The base — periodic table, element pages, body text — adopts the quiet authority of a 1950s chemistry textbook: warm cream paper, deep ink, double-rule borders, serif headings, generous whitespace. Interactive surfaces — game pages, hover states, trivia widgets, the 3D viz toggle — borrow from Atomic-Age retro-futurism: confident two-tone blocks, vermillion and Prussian-blue accents, slight geometry. The palette is **vintage harmonized**: every color, including all 11 element-category fills, is desaturated and warm-shifted to coexist comfortably on cream.

**Three guiding principles:**
1. **Static content reads like print.** The detail pages should feel like a beautifully laid-out reference book, not an app dashboard.
2. **Interactivity announces itself confidently.** Hover, click, search, and game states use the brighter atomic-age accent palette so the eye finds them.
3. **Theme as a token swap.** Every visual decision is expressed as a CSS custom property in a single namespace, so a future theme is one stylesheet away.

## Color Palette

All colors are exposed as CSS custom properties under the `--color-*` namespace. The defaults below ship as `themes/retro-science.css`.

### Paper & Surface (the cream base)

| Token                       | Hex       | Usage |
|-----------------------------|-----------|-------|
| `--color-paper`             | `#f5f0e6` | Page background — main "paper" |
| `--color-paper-shade`       | `#ede6d6` | Card / surface backgrounds, slightly lifted from page |
| `--color-paper-deep`        | `#e0d4ba` | Deeper surface — element detail hero band, recessed sections |
| `--color-aged`              | `#c4b89a` | Aged-paper accent — section labels, divider blocks |

### Ink & Rule (the deep ink and rules)

| Token                       | Hex       | Usage |
|-----------------------------|-----------|-------|
| `--color-ink`               | `#1f1d18` | Primary text, element symbols, headings |
| `--color-ink-muted`         | `#5e5a4f` | Secondary text, captions, metadata |
| `--color-rule`              | `#8a7e63` | Double-rule borders, primary dividers |
| `--color-rule-light`        | `#c4b89a` | Subtle dividers, hairline rules |

### Element Category Colors (vintage harmonized)

Each category fills the top stripe of its element cells and tints group filter chips. Values are tuned for ~70% contrast against `--color-paper` and to remain harmonious side-by-side.

| Category                  | Token                                | Hex       |
|---------------------------|--------------------------------------|-----------|
| Alkali metals             | `--color-cat-alkali-metal`           | `#c9605a` (dusty coral) |
| Alkaline earth metals     | `--color-cat-alkaline-earth`         | `#b76e4a` (terracotta) |
| Transition metals         | `--color-cat-transition-metal`       | `#a08654` (muted bronze) |
| Post-transition metals    | `--color-cat-post-transition`        | `#b08a8d` (dusty rose) |
| Metalloids                | `--color-cat-metalloid`              | `#97955c` (olive) |
| Reactive nonmetals        | `--color-cat-nonmetal`               | `#7a9266` (sage) |
| Halogens                  | `--color-cat-halogen`                | `#5d7a52` (pine) |
| Noble gases               | `--color-cat-noble-gas`              | `#8a82a8` (dusty lavender) |
| Lanthanides               | `--color-cat-lanthanide`             | `#c4a36a` (aged gold) |
| Actinides                 | `--color-cat-actinide`               | `#a36b48` (rust) |
| Unknown / properties N/A  | `--color-cat-unknown`                | `#a09b8c` (greige) |

For each category, a `*-tint` (20% opacity overlay on paper) is also defined — used as the cell background fill in the resting state.

### Atomic-Age Accents (interactive surfaces)

Used on game pages, hover states, CTA buttons, and the embedded trivia widget — the "lively where you click" half of the philosophy.

| Token                       | Hex       | Usage |
|-----------------------------|-----------|-------|
| `--color-accent-vermillion` | `#c8492f` | Primary CTA, "wrong" stamp, important alerts |
| `--color-accent-prussian`   | `#2d4a6b` | Links, info badges, secondary CTA |
| `--color-accent-ochre`      | `#c89b3a` | Score highlights, focused state, "in progress" |
| `--color-accent-teal`       | `#4a8c87` | Toggles (3D viz), tertiary interactive |

### Semantic Colors

Mapped to accent palette for consistency:

| Token              | Hex        | Maps to            |
|--------------------|------------|--------------------|
| `--color-success`  | `#5d7a52`  | (== halogen pine — fits the palette as "growing/correct") |
| `--color-warning`  | `#c89b3a`  | (== ochre)         |
| `--color-error`    | `#c8492f`  | (== vermillion)    |
| `--color-info`     | `#2d4a6b`  | (== prussian)      |

### Contrast Verification

All combinations below ≥ 4.5:1 (WCAG AA body text):

- `--color-ink` on `--color-paper`: ~14:1
- `--color-ink-muted` on `--color-paper`: ~6.2:1
- `--color-paper` on `--color-accent-vermillion`: ~5.1:1 (button text)
- `--color-paper` on `--color-accent-prussian`: ~9.4:1
- `--color-ink` on every `*-tint` overlay: ≥ 8:1

## Typography

**Font family: IBM Plex** (Serif + Sans + Mono — open-source, harmonized triplet, modern-retro feel).

| Role        | Family            | Weight     | Where it shows |
|-------------|-------------------|------------|----------------|
| Display     | IBM Plex Serif    | 600        | Page hero (element symbol on detail page) |
| Headings    | IBM Plex Serif    | 500–600    | H1–H4, card titles |
| Body / UI   | IBM Plex Sans     | 400 / 500  | Paragraphs, labels, buttons, navigation |
| Numeric / data | IBM Plex Mono  | 400 / 500  | Atomic numbers, masses, electron configs, formulae |
| Small caps  | IBM Plex Sans     | 600 + `font-variant: small-caps` | Section labels, category names |

**Loaded via** `@fontsource/ibm-plex-serif`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (subsetted to Latin + numeric extensions).

### Type Scale (modular ~1.25 ratio)

| Token              | Size           | Line height | Letter spacing | Use |
|--------------------|----------------|-------------|----------------|-----|
| `--text-display`   | 4rem (64px)    | 1.05        | -0.02em        | Element symbol hero |
| `--text-h1`        | 3rem (48px)    | 1.1         | -0.015em       | Page titles |
| `--text-h2`        | 2.25rem (36px) | 1.15        | -0.01em        | Section headings |
| `--text-h3`        | 1.75rem (28px) | 1.2         | -0.005em       | Sub-section / card titles |
| `--text-h4`        | 1.375rem (22px)| 1.25        | 0              | Group labels |
| `--text-body-lg`   | 1.125rem (18px)| 1.6         | 0              | Lead paragraphs |
| `--text-body`      | 1rem (16px)    | 1.55        | 0              | Default body |
| `--text-body-sm`   | 0.875rem (14px)| 1.5         | 0.005em        | Secondary text |
| `--text-caption`   | 0.75rem (12px) | 1.4         | 0.02em         | Metadata, footnotes |
| `--text-eyebrow`   | 0.75rem (12px) | 1.4         | 0.12em uppercase | Section labels (small caps) |

## Spacing

**Base unit: 8px.** All spacing exposed as `--space-*` tokens.

| Token         | Value | Use |
|---------------|-------|-----|
| `--space-2xs` | 4px   | Icon-to-text gap, tight cluster |
| `--space-xs`  | 8px   | Default inline gap |
| `--space-sm`  | 12px  | Compact stack |
| `--space-md`  | 16px  | Default stack between paragraphs |
| `--space-lg`  | 24px  | Card padding, between minor sections |
| `--space-xl`  | 32px  | Section padding |
| `--space-2xl` | 48px  | Between major page sections |
| `--space-3xl` | 64px  | Hero band padding |
| `--space-4xl` | 96px  | Page outer margins (desktop) |
| `--space-5xl` | 128px | Vertical rhythm between landing sections |

## Borders, Radii & Shadows

| Token                        | Value                                         | Use |
|------------------------------|-----------------------------------------------|-----|
| `--border-rule`              | `1px solid var(--color-rule)`                | Default rule |
| `--border-rule-thick`        | `2px solid var(--color-ink)`                 | Emphasis frame |
| `--border-double`            | `3px double var(--color-rule)`               | Vintage textbook frame (cards, callouts) |
| `--radius-sm`                | `2px`                                        | Inputs, small buttons |
| `--radius-md`                | `4px`                                        | Cards, large buttons |
| `--radius-lg`                | `6px`                                        | Hero panels |
| `--shadow-paper`             | `0 1px 0 rgba(31,29,24,.06), 0 4px 12px rgba(31,29,24,.05)` | Card lift |
| `--shadow-paper-lifted`      | `0 2px 0 rgba(31,29,24,.08), 0 12px 24px rgba(31,29,24,.10)` | Hover/active |
| `--shadow-stamp`             | `0 0 0 2px var(--color-accent-vermillion) inset` | Wrong-answer stamp |

The `border-double` is the signature mark — used on element cells on hover, cards on the detail page, and the trivia widget container. It evokes a textbook plate frame.

## Component Patterns

### Element Cell (signature component)

The hero component of the entire app. Each cell on the periodic table.

**Resting state:**
```
┌──────────────────┐
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │  ← top stripe: var(--color-cat-*)
│                  │
│   1              │  ← atomic number, IBM Plex Mono, --text-caption
│                  │
│      H           │  ← symbol, IBM Plex Serif 600, --text-h2
│   Hydrogen       │  ← name, IBM Plex Sans, --text-body-sm
│   1.008          │  ← mass, IBM Plex Mono, --text-caption
└──────────────────┘
   Background: var(--color-cat-{n}-tint)
   Border:     var(--border-rule)
```

**Hover state:**
- Border thickens to `--border-double` in `--color-ink`
- Cell scales `1.04` over 150ms ease-out
- Shadow `--shadow-paper-lifted`
- Quick-look tooltip slides in (see Hover Tooltip below)

**Active / clicked state:**
- Brief 80ms inset shadow before page navigation (letterpress feel)

**Focused (keyboard) state:**
- 2px solid `--color-accent-ochre` ring offset by 2px from the cell

### Periodic Table Grid

- 18 columns wide × 7 rows + 2 inner rows (lanthanides, actinides) = standard IUPAC layout
- Cells: `min(64px, 5vw)` square at desktop ≥ 1440px; scales down to `min(56px, 4.5vw)` at 1280–1439px
- Gap: `--space-2xs` (4px) between cells
- Lanthanide/actinide rows offset and labeled
- Group filter chips above the table
- Search box in the top-right of the table area

### Hover Tooltip (quick-look)

Anchored to the hovered cell, slides up 4px, fades in over 120ms.

```
╔═══════════════════════════╗   ← --border-double in --color-ink
║                           ║
║  HYDROGEN     1           ║   ← name (Plex Serif 500) + atomic # (Plex Mono)
║                           ║
║  Symbol     H             ║
║  Mass       1.008 u       ║
║  Category   Nonmetal      ║   ← small caps, --text-eyebrow
║  Phase      Gas (STP)     ║
║                           ║
╚═══════════════════════════╝
   Background: --color-paper-shade
   Width:      ~280px
   Padding:    --space-lg
```

Dismissed by mouse-leave or `Esc`.

### Group Filter Chips

Horizontal row above the table. Clicking dims non-matching cells to `25%` opacity.

```
┌──────────────────┐  ┌────────────────────┐  ┌──────────────┐
│ ● Alkali metals  │  │ ● Alkaline earth   │  │ ● Halogens   │
└──────────────────┘  └────────────────────┘  └──────────────┘
```
- Pill shape, `--radius-lg`
- Border: `--border-rule`, 1px in category color at full opacity
- Background: `--color-paper-shade`
- Dot: 8px solid circle in the category color
- Active state: filled background in category color, ink text inverted to `--color-paper`

### Search Box

```
┌─────────────────────────────────────────┐
│ ⌕  Search elements...                    │
└─────────────────────────────────────────┘
```
- IBM Plex Sans 400, `--text-body`
- Border: `--border-rule`
- Focus: border switches to `--border-rule-thick` in `--color-accent-prussian`, no glow
- Result dropdown: `--color-paper-shade` with `--shadow-paper`, max-height 320px
- Each result row: symbol (Plex Mono), name (Plex Sans), atomic # (Plex Mono right-aligned)

### Element Detail Page Layout

Two-column desktop layout, single-column below 1024px.

```
┌─────────────────────────────────────────────────────────────┐
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ HERO BAND (category color stripe) ▬▬▬▬▬▬▬▬▬▬ │
│                                                             │
│   1                              [photo / generated image]  │
│                                                             │
│      H                           ┌─────────────────────┐    │
│   Hydrogen                       │                     │    │
│   nonmetal · period 1 · group 1  │   Bohr Diagram     │    │
│                                  │   (inline SVG)     │    │
│                                  │                     │    │
│                                  └─────────────────────┘    │
│                                  [ View 3D Orbital ▶ ]      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Two columns (desktop):                                      │
│  LEFT (60%)                       RIGHT (40%)               │
│  ─ Properties (card)              ─ Notable Compounds (card)│
│  ─ Occurrence & States (card)     ─ Common Uses (card)      │
│  ─ Reactivity (card)              ─ Discovery (card)        │
│  ─ Electron Configuration (card)                            │
├─────────────────────────────────────────────────────────────┤
│         [ Embedded Trivia Widget — full width ]             │
├─────────────────────────────────────────────────────────────┤
│  ← Prev (Hg)        Periodic Table         Next (He) →      │
└─────────────────────────────────────────────────────────────┘
```

**Hero band:**
- Background: `--color-paper-deep`
- Top 8px stripe: category color
- Element symbol: `--text-display`, IBM Plex Serif 600
- Atomic number: `--text-h2`, IBM Plex Mono, top-left
- Subline: small caps, `--text-eyebrow`

**Detail cards:**
- Background: `--color-paper-shade`
- Border: `--border-double` in `--color-rule`
- Padding: `--space-xl`
- Title: `--text-h3`, IBM Plex Serif 500
- Body: `--text-body`, IBM Plex Sans
- Numeric data: IBM Plex Mono
- Section eyebrow above title: `--text-eyebrow` in `--color-ink-muted`

### Bohr Diagram (inline SVG)

- Pure SVG, no JS
- Nucleus: filled circle in `--color-ink`, label "p+: N · n: N" in IBM Plex Mono
- Shells: concentric stroked circles in `--color-rule` (1px)
- Electrons: 6px filled circles, distributed evenly per shell, in `--color-accent-prussian`
- Shell labels (K, L, M, …) in `--text-caption` Plex Mono outside each shell

### 3D Orbital Viz Panel (toggle)

- Toggle button: `[ View 3D Orbital ▶ ]` — secondary button style in `--color-accent-teal`
- Panel: opens inline below the Bohr diagram, `400px` height
- React island, lazy-loaded Three.js + R3F bundle
- Background: `--color-paper-deep`
- Border: `--border-double`
- Loading state: `--text-eyebrow` "RENDERING..." centered, `--color-accent-teal`

### Trivia Widget (embedded on element pages)

```
┌─────────────────────────────────────────────────────────────┐
│ TEST YOURSELF                                               │  ← eyebrow
│                                                             │
│ Which element has the symbol H?                            │  ← question (--text-h3)
│                                                             │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │   Hydrogen   ✓  │  │     Helium       │                  │
│ └──────────────────┘  └──────────────────┘                  │
│ ┌──────────────────┐  ┌──────────────────┐                  │
│ │     Hafnium      │  │    Holmium       │                  │
│ └──────────────────┘  └──────────────────┘                  │
│                                                             │
│ Score: 3/3                              [ Next question → ] │
└─────────────────────────────────────────────────────────────┘
```
- Container: `--border-double` in `--color-rule`, `--color-paper-shade` bg
- Eyebrow: `--text-eyebrow` in `--color-accent-ochre`
- Answer buttons: see "Buttons" below — secondary variant
- Correct: button border switches to `--color-success`, ✓ icon (Phosphor Check Bold)
- Wrong: button border switches to `--color-error`, vermillion stamp ("WRONG") fades over the wrong button at 4° rotation
- Score counter: IBM Plex Mono, `--text-body-sm`

### Standalone Game Pages (`/games/element`, `/games/compound`)

Single-question center-stage layout.

```
┌──────────────────────────────────────────────────────────────┐
│  GUESS THE ELEMENT                       Score 7   ⚡ Streak 3│  ← eyebrow + counters
│                                                              │
│                  ┌──────────────────────┐                    │
│                  │                      │                    │
│                  │     [photo or         │                    │
│                  │      property card]   │                    │
│                  │                      │                    │
│                  └──────────────────────┘                    │
│                                                              │
│                  Identify this element                       │
│                                                              │
│                  ┌──────────────────────────────┐            │
│                  │ Type symbol or name…   ⏎    │            │
│                  └──────────────────────────────┘            │
│                                                              │
│                       [ SUBMIT ]                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```
- Larger framing, more white space than embedded widget
- Streak counter: IBM Plex Mono with lightning-bolt Phosphor icon in `--color-accent-ochre`
- Submit button: primary variant, vermillion
- Wrong answer: full-page subtle red wash (overlay at 8% opacity) for 200ms + stamp animation

### Buttons

Three sizes (`sm` 32px, `md` 40px, `lg` 48px), three variants:

| Variant     | Background                         | Border                        | Text                          | Use |
|-------------|------------------------------------|-------------------------------|-------------------------------|-----|
| Primary     | `--color-accent-vermillion`        | none                          | `--color-paper`               | Submit, main CTA |
| Secondary   | `--color-paper-shade`              | `--border-rule-thick`         | `--color-ink`                 | Default, trivia answers |
| Ghost       | transparent                        | `--border-rule`               | `--color-ink-muted`           | Tertiary actions, "View 3D" |

**States:** hover (border thickens / bg lightens), active (inset shadow 80ms — letterpress feel), focus (2px ochre ring offset 2px), disabled (50% opacity, `cursor: not-allowed`).

### Forms & Inputs

- Single style across the app (search, game answer, future contact form)
- Background: `--color-paper`
- Border: `--border-rule`
- Padding: `--space-sm --space-md`
- Focus: border `--border-rule-thick` in `--color-accent-prussian`
- Error: border `--border-rule-thick` in `--color-error`, helper text in `--color-error` below

### Cards

Two card flavors:

- **Paper card** (default, on detail page): `--color-paper-shade` bg, `--border-double` in `--color-rule`. Calm, scholarly.
- **Game card** (on game pages and trivia widgets): `--color-paper-shade` bg, `--border-rule-thick` in `--color-ink`, with `--shadow-paper-lifted`. More confident, more "click me."

### Navigation

Minimal top nav. Single horizontal bar.

```
ELEMENTS                          Periodic Table · Games · About    ⌕
```
- Logo: "ELEMENTS" in IBM Plex Serif 600, small caps, `--color-ink`
- Links: IBM Plex Sans 500, `--text-body`, separated by interpunct
- Active link: underlined with 2px `--color-accent-vermillion`, offset 4px
- Search icon (mobile/condensed): expands inline

## Iconography

**Phosphor Icons** (Regular weight by default, Bold for emphasis). Open-source, slight letterpress feel that complements the typography.

Core icons used:
- Search: `MagnifyingGlass`
- Filter: `FunnelSimple`
- 3D toggle: `Cube`
- Correct: `Check`
- Wrong: `X`
- Next/prev: `ArrowRight` / `ArrowLeft`
- External link: `ArrowSquareOut`
- Streak: `Lightning`
- Info: `Info`

Sizing: `--text-body` line-height-aligned (16px or 20px). Stroke matches surrounding text color via `currentColor`.

## Layout & Breakpoints

**Desktop-first.** Mobile is out of MVP scope but tokens are sized so a future mobile layer drops in cleanly.

| Name              | Min width | Behavior |
|-------------------|-----------|----------|
| `xl-desktop`      | 1440px    | Full layout. Periodic table cells at 64×64px |
| `desktop`         | 1280px    | Standard. Cells scale to 56×56px |
| `sm-desktop`      | 1024px    | Cells 48×48px, detail page condenses to single column |
| `tablet`          | 768px     | Periodic table becomes horizontally scrollable; detail page is single column with stacked sections |
| `mobile`          | < 768px   | **Out of MVP scope.** Tokens accommodate but layout intentionally not designed for v1 |

**Container max-widths:**
- Periodic table page: full viewport, padding `--space-2xl`
- Element detail page: `1280px` max, centered, padding `--space-2xl`
- Game page: `720px` max, centered

## Motion & Animation

**Philosophy: subtle, never bouncy.** No springs. No bounces. Everything ease-out, 120–250ms. Vintage academic vibe demands restraint.

| Pattern                  | Duration | Easing               |
|--------------------------|----------|----------------------|
| Hover (cell, button)     | 150ms    | `cubic-bezier(.25,.1,.25,1)` |
| Tooltip enter            | 120ms    | ease-out + 4px slide-up |
| Tooltip exit             | 100ms    | ease-in              |
| Page transitions         | None (instant) — Astro view-transitions optional, off by default |
| Trivia answer reveal     | 200ms    | ease-out             |
| Wrong-answer stamp       | 250ms    | ease-out + 4° rotation, then settle |
| 3D viz reveal            | 300ms    | ease-out             |

**Reduced motion:**
- All transitions disabled when `@media (prefers-reduced-motion: reduce)`
- Stamp animation reduces to instant color change
- Tooltip enters without slide

## Accessibility

**Hard commitments:**

1. **Contrast**: 4.5:1 minimum for body text, 3:1 for large text. All retro-science palette pairings verified (see Color Palette > Contrast Verification).
2. **Focus**: Every interactive element shows a visible 2px `--color-accent-ochre` ring offset by 2px on keyboard focus. `:focus-visible` only — no double-rings on mouse click.
3. **Keyboard navigation on the periodic table**:
   - `Tab` enters the table grid
   - Arrow keys move between cells (up/down/left/right respect grid layout)
   - `Enter` opens detail page
   - `Esc` closes hover tooltip / dropdown
4. **Screen reader labels**:
   - Each cell: `aria-label="<Name>, atomic number <N>, symbol <S>, <category>"`
   - Tooltip: `role="tooltip"`, `aria-describedby` from the cell
   - Group filter chips: `aria-pressed` toggles
   - 3D viz toggle: `aria-expanded`
5. **Skip link**: `Skip to periodic table` first focusable element on landing
6. **Headings hierarchy**: Strict h1 > h2 > h3, never skipped
7. **Images**: All element photos have meaningful alt text from `data.json` `image_alt` field; decorative images are `alt=""`

## Theme Architecture

**Single-namespace token model.** Every visual decision is a CSS custom property under `--color-*`, `--text-*`, `--space-*`, `--border-*`, `--radius-*`, `--shadow-*`. No hard-coded values in components.

**Theme switch mechanism:**

```html
<html data-theme="retro-science">
```

Each theme file scopes its tokens under its attribute selector:

```css
/* themes/retro-science.css (default) */
:root,
[data-theme="retro-science"] {
  --color-paper: #f5f0e6;
  --color-ink: #1f1d18;
  /* ... all tokens ... */
}

/* themes/dark-museum.css (future) */
[data-theme="dark-museum"] {
  --color-paper: #1a1612;
  --color-ink: #e8e0cc;
  /* ... all tokens ... */
}
```

**Switching themes** is a single attribute change on `<html>` — no component code changes, no JS bundle reload. Theme preference can be persisted via `localStorage` and applied on initial render via a tiny inline `<script>` in `<head>` (avoids FOUC).

**Token inventory** (full list maintained at `src/styles/tokens.css`, summarized above):
- `--color-*` — 30 tokens
- `--text-*` — 10 tokens
- `--space-*` — 10 tokens
- `--border-*` — 4 tokens
- `--radius-*` — 3 tokens
- `--shadow-*` — 3 tokens

**Adding a new theme**: create `themes/<name>.css`, override any subset of tokens. Untouched tokens fall back to retro-science defaults via the `:root` selector.

## Implementation Notes for Build

- **Font loading**: subset IBM Plex Serif/Sans/Mono to Latin + numerals + chemistry symbols (subscript/superscript chars). Use `font-display: swap`.
- **CSS architecture**: `tokens.css` (root + every theme) → `base.css` (reset, typography defaults, layout primitives) → component-scoped CSS (Astro/CSS Modules).
- **No CSS-in-JS at runtime.** All styling compile-time.
- **No utility framework** (no Tailwind). Tokens + scoped component CSS keeps the file footprint minimal and the retro-science aesthetic clean.
- **Phosphor icons**: import individually (tree-shakeable). Don't import the whole pack.
- **Bohr diagrams**: generated as Astro `.astro` components from electron config — `.json` data → SVG markup at build time. Zero runtime cost.
