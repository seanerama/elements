# Interface Contract: Design Tokens

**Between**: Stage 1 (Foundation) → Stages 3–7 (all UI stages)
**Created**: 2026-05-06

## Provider (Stage 1)

### Exports

A complete CSS custom property set, defined at `:root` (and under `[data-theme="retro-science"]`) in `src/styles/tokens.css` + `src/styles/themes/retro-science.css`. The token namespaces and full inventory are documented in `sdd-output/design-system.md`.

### Token Namespaces

| Namespace        | Count | Examples |
|------------------|-------|----------|
| `--color-*`      | ~30   | `--color-paper`, `--color-ink`, `--color-cat-noble-gas`, `--color-accent-vermillion` |
| `--text-*`       | 10    | `--text-h1`, `--text-body`, `--text-eyebrow` |
| `--space-*`      | 10    | `--space-md`, `--space-2xl` |
| `--border-*`     | 4     | `--border-rule`, `--border-double` |
| `--radius-*`     | 3     | `--radius-md` |
| `--shadow-*`     | 3     | `--shadow-paper`, `--shadow-stamp` |

### Loading guarantee

The token CSS file is imported once via `BaseLayout.astro` and is therefore present on every page. Consumers do **not** import token CSS files directly — they reference the variables.

### Theme-switching guarantee

A theme switch happens via `document.documentElement.setAttribute('data-theme', '<name>')`. No JS bundle reload, no FOUC if the initial value is set inline before paint.

## Consumer (Stages 3–7)

### Imports

Nothing import-style — consumers reference tokens via plain CSS:

```css
.element-cell {
  background: var(--color-paper-shade);
  color: var(--color-ink);
  border: var(--border-rule);
  padding: var(--space-md);
  font-family: var(--font-serif);
}
```

### Usage Rules (binding)

1. **No hard-coded colors, font sizes, spacings, borders, or shadows in any component.** Every visual decision must reference a token. Lint rule (`stylelint-declaration-strict-value`) enforces this.
2. **Category colors** for element cells must use `--color-cat-<category>` and the matching `--color-cat-<category>-tint` for the cell fill — never raw hex.
3. **Component-scoped CSS only** — no global selectors except those defined in `base.css` (reset, typography defaults).
4. **Add new tokens, never new hexes.** If a designed component needs a new color/spacing, add a token to `tokens.css` and document in `design-system.md`.

## Validation

- [ ] `tokens.css` and `themes/retro-science.css` are present and imported via `BaseLayout.astro`
- [ ] Stylelint rule rejects raw color values, raw font sizes, and raw spacing values in component CSS
- [ ] Theme switch via `data-theme` attribute swaps every documented token namespace
- [ ] Initial-render inline `<script>` reads `localStorage` and sets `data-theme` before paint (no FOUC)
- [ ] All consumers (Stages 3–7) reference tokens only; CI grep for raw hex (`#[0-9a-fA-F]{3,8}`) outside `tokens.css` / `themes/*.css` returns zero hits
