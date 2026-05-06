# Interface Contract: Image Asset

**Between**: Stage 2 (Image Pipeline) → Stages 3, 4 (Landing, Detail)
**Created**: 2026-05-06

## Provider (Stage 2)

### Output Layout

```
data/elements/<symbol>/
├── data.json
└── images/
    ├── sample.jpg              # primary photo (or generated image)
    ├── sample.license.json     # license sidecar
    ├── compound-water.jpg      # optional additional images
    ├── compound-water.license.json
    └── ...
```

### Image File Rules

- **Format**: `.jpg` (preferred for photos) or `.png` (for diagrams / synthetic visualizations).
- **Dimensions**: Primary image is **1280×960** (4:3). Additional images may be smaller; minimum 640×480.
- **Compression**: JPEG quality 82, mozjpeg encoder. PNG via `oxipng`.
- **Filenames**: lowercase, hyphen-separated, no spaces. The primary image is always named `sample.<ext>`.
- **Color profile**: sRGB. Strip EXIF except orientation.

### License Sidecar Format

For every image file `<name>.<ext>`, a sibling `<name>.license.json` records provenance:

```json
{
  "source": "wikimedia" | "nano-banana-pro" | "manual",
  "license": "CC-BY-SA-4.0" | "CC-BY-4.0" | "CC0" | "PUBLIC-DOMAIN" | "GENERATED",
  "attribution": "Photographer Name (CC BY-SA 4.0) — Wikimedia Commons",
  "source_url": "https://commons.wikimedia.org/wiki/File:...",
  "fetched_at": "2026-05-06T19:35:00Z",
  "prompt": "<only present when source is 'nano-banana-pro'>"
}
```

### Allowed Licenses

The pipeline must reject anything outside this set:

- `CC-BY-4.0`
- `CC-BY-SA-4.0`
- `CC0`
- `PUBLIC-DOMAIN`
- `GENERATED` (Nano Banana Pro output, license-clear by service terms)

If no acceptable Wikimedia image is found for an element, fall back to Nano Banana Pro generation. If both fail, emit a placeholder image (`data/_placeholders/no-image.jpg`) and log a warning — the build does not fail.

## Consumer (Stages 3, 4)

### Imports

```typescript
import type { Element } from '@/types/element';
const element = await loadElement('h');
const imgPath = `/data/elements/${element.symbol.toLowerCase()}/${element.image_primary}`;
const altText = element.image_alt;
```

### Display Rules

- Always render with explicit `width`/`height` attributes to prevent layout shift.
- Use Astro's `<Image>` component (or equivalent) so images are pre-optimized at build time and served at appropriate dimensions for hero band, card thumbnails, etc.
- Always render the `image_alt` from `data.json` — never derive alt text from filename.
- Below each prominent image, render a tiny attribution caption pulled from the `.license.json` sidecar — IBM Plex Mono, `--text-caption`, `--color-ink-muted`. Required for `CC-BY*` licensed content.

## Validation

- [ ] Every element with `image_primary !== null` has a corresponding image file at the documented path
- [ ] Every image file has a sibling `.license.json` sidecar
- [ ] No image has a license outside the allowed set
- [ ] Primary images are 1280×960, sRGB, ≤ 200 KB after compression
- [ ] `<Image>` is used for all rendering; no raw `<img>` tags reference asset paths
- [ ] Attribution caption renders for every `CC-BY*` licensed image on element detail pages
