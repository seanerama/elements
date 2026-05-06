# Interface Contract: Element Schema

**Between**: Stage 2 (Data Pipeline) → Stages 3, 4, 6 (Landing, Detail, Trivia)
**Created**: 2026-05-06

## Provider (Stage 2)

### Exports

A Zod schema (`src/types/element.ts`) and one validated JSON file per element at `data/elements/<symbol>/data.json`. Symbol path segment is **lowercase** (e.g. `data/elements/h/`, `data/elements/he/`, `data/elements/uuo/`).

### Data Format

```json
{
  "schema_version": "1.0.0",
  "atomic_number": 1,
  "symbol": "H",
  "name": "Hydrogen",
  "name_origin": "Greek 'hydro' (water) + 'genes' (forming)",
  "category": "nonmetal",
  "period": 1,
  "group": 1,
  "block": "s",
  "atomic_mass": 1.008,
  "atomic_mass_uncertain": false,
  "electron_configuration": "1s1",
  "electron_configuration_short": "1s1",
  "electrons_per_shell": [1],
  "phase_at_stp": "gas",
  "density_g_per_cm3": 0.00008988,
  "melting_point_k": 14.01,
  "boiling_point_k": 20.28,
  "electronegativity_pauling": 2.20,
  "oxidation_states": [-1, 1],
  "discovery": {
    "year": 1766,
    "discoverer": "Henry Cavendish",
    "country": "England"
  },
  "occurrence": {
    "natural": true,
    "abundance_summary": "Most abundant element in the universe; ~0.14% by mass on Earth's crust.",
    "states": ["gas", "rare liquid/solid at low T"]
  },
  "compounds": [
    {
      "formula": "H2O",
      "name": "Water",
      "summary": "Universal solvent, essential for life."
    }
  ],
  "uses": [
    "Ammonia synthesis (Haber process)",
    "Rocket fuel (LH2)",
    "Hydrogenation of fats",
    "Fuel cells"
  ],
  "reactivity_summary": "Highly reactive at high temperatures; forms covalent bonds with most nonmetals and ionic hydrides with active metals.",
  "isotopes_summary": "Three naturally occurring isotopes: protium (¹H, ~99.98%), deuterium (²H, ~0.02%), tritium (³H, trace, radioactive).",
  "image_primary": "images/sample.jpg",
  "image_alt": "A glass discharge tube glowing pink-purple, filled with hydrogen gas",
  "citations": [
    {
      "field": "atomic_mass",
      "source": "IUPAC 2021",
      "url": "https://iupac.org/..."
    }
  ]
}
```

### Schema Rules

- All fields above are **required** unless explicitly noted (`null` allowed for missing data, but field key must be present).
- `category` ∈ `"alkali-metal" | "alkaline-earth" | "transition-metal" | "post-transition" | "metalloid" | "nonmetal" | "halogen" | "noble-gas" | "lanthanide" | "actinide" | "unknown"` (matches `--color-cat-*` tokens by stripping `--color-cat-` prefix).
- `phase_at_stp` ∈ `"gas" | "liquid" | "solid" | "unknown"`.
- `block` ∈ `"s" | "p" | "d" | "f"`.
- `compounds` array length ≥ 0; for noble gases (e.g. He, Ne, Ar) may be empty.
- `electrons_per_shell` array sum must equal `atomic_number`.
- `image_primary` is relative to the element's folder. Always present for naturally occurring elements; for synthetic elements with no image source, set to `null`.
- `schema_version` is bumped only by Stage 2 owner. Consumers may match by major version.

## Consumer (Stages 3, 4, 6)

### Imports

```typescript
import { ElementSchema, type Element } from '@/types/element';
import { loadAllElements, loadElement } from '@/lib/elements';

const elements = await loadAllElements();        // Element[]
const hydrogen = await loadElement('h');         // Element | null
```

### Usage by Stage

- **Stage 3 (Landing)**: reads all 118 via `loadAllElements()` for the table grid and search index. Uses `category` to apply `--color-cat-*-tint` to cells.
- **Stage 4 (Detail Pages)**: `getStaticPaths()` over all 118; renders detail page from one record. Uses `electrons_per_shell` to render Bohr diagrams.
- **Stage 6 (Trivia)**: reads `data/trivia/element-questions.json` (separate contract), but trivia engine may also surface element data for "explanation" reveals after a wrong answer.

## Validation

- [ ] Stage 2 emits exactly 118 element JSON files at `data/elements/<symbol>/data.json`
- [ ] Every file passes Zod validation against the schema
- [ ] `electrons_per_shell` sum equals `atomic_number` for every element
- [ ] `category` values match the design-system token suffixes 1-to-1
- [ ] `loadAllElements()` and `loadElement()` are typed against the inferred Zod type
- [ ] Stages 3, 4, 6 import only from `@/lib/elements` — no direct fs reads from consumers
- [ ] Pipeline test (Stage 2): 5 hand-picked sample elements (H, Fe, Au, Xe, U) load + validate + render a smoke detail page successfully
