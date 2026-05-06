# Interface Contract: Trivia Question Bank

**Between**: Stage 2 (Trivia Generator) → Stages 6, 7 (Trivia Engine, Game Pages)
**Created**: 2026-05-06

## Provider (Stage 2)

### Exports

Two JSON bundles built at `npm run data:build` time, output to `data/trivia/`:

- `data/trivia/element-questions.json`
- `data/trivia/compound-questions.json`

### Data Format

```json
{
  "schema_version": "1.0.0",
  "generated_at": "2026-05-06T19:30:00Z",
  "questions": [
    {
      "id": "elem-h-symbol-001",
      "type": "element",
      "subject_symbol": "H",
      "prompt": "What is the chemical symbol for Hydrogen?",
      "prompt_kind": "text",
      "image_path": null,
      "answer": "H",
      "alternates": ["h"],
      "distractors": ["He", "Hg", "Hf"],
      "explanation": "Hydrogen, atomic number 1, uses the symbol H from its Latin/Greek root 'hydro' (water).",
      "difficulty": "easy",
      "tags": ["symbol", "naming"]
    },
    {
      "id": "elem-photo-au-001",
      "type": "element",
      "subject_symbol": "Au",
      "prompt": "Identify this element from its photograph.",
      "prompt_kind": "image",
      "image_path": "/data/elements/au/images/sample.jpg",
      "answer": "Gold",
      "alternates": ["gold", "Au", "au"],
      "distractors": ["Copper", "Brass", "Pyrite"],
      "explanation": "Gold (Au) is identified by its distinctive metallic yellow luster.",
      "difficulty": "easy",
      "tags": ["photo", "identification"]
    },
    {
      "id": "comp-h2o-name-001",
      "type": "compound",
      "subject_formula": "H2O",
      "prompt": "What compound has the formula H₂O?",
      "prompt_kind": "text",
      "image_path": null,
      "answer": "Water",
      "alternates": ["water", "dihydrogen monoxide"],
      "distractors": ["Hydrogen peroxide", "Heavy water", "Methane"],
      "explanation": "Water is the most common compound on Earth, formed from two hydrogen and one oxygen atom.",
      "difficulty": "easy",
      "tags": ["formula", "common"]
    }
  ]
}
```

### Generation Rules

- **Element question types** (auto-derived from each element's `data.json`):
  - `symbol` — "What's the symbol for X?"
  - `name-from-symbol` — "Which element has the symbol X?"
  - `atomic-number` — "Which element has atomic number N?"
  - `electron-config` — "Which element has electron configuration X?"
  - `category` — "Which category does X belong to?"
  - `photo-id` — Image-based; generated only for elements with `image_primary !== null`

- **Compound question types**:
  - `formula-to-name` — "What compound is H₂O?"
  - `name-to-formula` — "What is the chemical formula for water?"
  - Pulled from union of all element `compounds` arrays in element data.

- **Distractors** drawn from same category (for elements) or same element family (for compounds) where possible to keep difficulty consistent.

- **Difficulty heuristic**:
  - `easy` — common elements (H, O, Na, Au, Fe, etc.) and recognizable compounds (H₂O, CO₂, NaCl)
  - `medium` — less common but still notable (Pd, Os, Hf)
  - `hard` — synthetic / rare-earth / lanthanides / actinides

- **ID format**: `<type>-<subject>-<question-kind>-<seq>`. IDs are stable across rebuilds for the same input data — re-running the pipeline does not invalidate existing localStorage scores.

- **Volume**: Aim for ~5–8 element questions per element (~600–950 total) and ~150–200 compound questions.

### Validation in pipeline

- Every question has at least 3 distractors
- `answer` is never present in `distractors`
- `image_path`, when set, points to an actual file under `data/elements/`
- `subject_symbol` (element) or `subject_formula` (compound) matches a known record

## Consumer (Stages 6, 7)

### Imports

```typescript
import { loadElementQuestions, loadCompoundQuestions } from '@/lib/trivia-engine';

const elementQs = await loadElementQuestions();   // returns Question[] from JSON
```

### Usage

- **Stage 6 (Embedded Trivia Widget)**: filters by `subject_symbol === currentElement.symbol` to show only questions about the element on its detail page
- **Stage 7 (Standalone Game Pages)**: shuffles full bank, presents one at a time, scores hits against `answer` + `alternates` (case-insensitive)

## Validation

- [ ] `data/trivia/element-questions.json` exists and validates against schema
- [ ] `data/trivia/compound-questions.json` exists and validates against schema
- [ ] Every element with a `data.json` produces at least 5 questions
- [ ] Every question has ≥3 distractors and no overlap with `answer`
- [ ] Image-based questions reference real image paths
- [ ] Question IDs are stable across rebuilds (test: hash sorted IDs before and after a no-op rebuild — must match)
