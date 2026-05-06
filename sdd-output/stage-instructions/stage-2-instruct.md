# Stage 2: Element Data Schema & Pipeline

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Define the canonical element data schema (Zod) and TypeScript types
- Build the per-element data pipeline that uses sub-agents to fetch + structure data from the web
- Build the image sourcing pipeline (Wikimedia first, Nano Banana Pro fallback) with strict license discipline
- Build the trivia question generator
- Run the pipeline once and commit all 118 element folders, image sets, and trivia banks
- Provide typed loader utilities (`loadAllElements`, `loadElement`) that downstream UI stages will use

## What to Build

### Files

- `src/types/element.ts` — Zod schema mirroring `contracts/element-schema.md`; export inferred `Element` type and `ElementSchema`
- `src/types/trivia.ts` — Zod schema for `Question` mirroring `contracts/trivia-question.md`
- `src/types/image-license.ts` — Zod schema for the `.license.json` sidecar
- `src/lib/elements.ts` — `loadAllElements()`, `loadElement(symbol)`, build-time loaders (read JSON from `data/elements/`); validate via Zod and throw on schema failure
- `pipelines/README.md` — How to run, env vars required, expected output, re-run policy ("manual only, never CI")
- `pipelines/element-list.ts` — hard-coded array of all 118 elements (atomic_number, symbol, name, expected category) used as input to the pipeline
- `pipelines/fetch-element-data.ts` — Driver that, for each entry in element-list, spawns a sub-agent with a tightly-scoped research prompt. Validates response against `ElementSchema`. Writes `data/elements/<symbol>/data.json`. Retries up to 3× on failure
- `pipelines/source-images.ts` — Wikimedia Commons API client with license filter (CC-BY/CC-BY-SA/CC0/PD only). Falls back to Nano Banana Pro generation when no acceptable image is found. Writes `images/sample.jpg` + `images/sample.license.json` per element. Uses `sharp` to resize/compress to 1280×960 sRGB JPEG q=82
- `pipelines/build-trivia.ts` — Reads all element JSON, generates 5–8 questions per element across the documented question kinds; cross-references compounds for the compound bank; writes `data/trivia/element-questions.json` and `data/trivia/compound-questions.json`
- `pipelines/lib/sub-agent.ts` — Shared utility that wraps the sub-agent invocation with retry, timeout, and Zod validation
- `data/_placeholders/no-image.jpg` — Branded placeholder used when both Wikimedia and Nano Banana fail
- `package.json` script entries: `data:build` (runs all three pipelines), `data:elements`, `data:images`, `data:trivia` (individual)
- `tests/unit/elements-loader.test.ts` — Vitest covering `loadElement('h')`, schema validation rejecting malformed records, `electrons_per_shell` sum invariant
- `tests/unit/trivia-build.test.ts` — Vitest covering question generation rules (≥3 distractors, no answer in distractors, stable IDs across reruns)

### Components

None (Stage 2 is data-only).

### Output Artifacts (committed)

After running `npm run data:build`, the following must exist and be committed:

```
data/
├── elements/
│   ├── h/data.json
│   ├── h/images/sample.jpg
│   ├── h/images/sample.license.json
│   ├── ... (118 element folders total)
└── trivia/
    ├── element-questions.json
    └── compound-questions.json
```

## Interface Contracts

### Exposes

- **Element Schema** (`contracts/element-schema.md`) — typed loader API + JSON shape
- **Image Asset** (`contracts/image-asset.md`) — file layout, license sidecar format, allowed licenses
- **Trivia Question Bank** (`contracts/trivia-question.md`) — JSON shape, generation rules, ID stability

### Consumes

- **Design Tokens** (Stage 1) — only for the placeholder image's color palette if generated

## Testing Requirements

- [ ] Vitest: `loadElement('h')` returns valid `Element` matching schema
- [ ] Vitest: malformed `data.json` causes `loadAllElements()` to throw with a clear error
- [ ] Vitest: `electrons_per_shell` sum equals `atomic_number` for all 118
- [ ] Vitest: trivia bank has ≥5 questions per element, ≥3 distractors per question, no `answer` in `distractors`
- [ ] Vitest: re-running `build-trivia` against same data produces byte-identical JSON (stable IDs and ordering)
- [ ] Pipeline acceptance: `npm run data:build` from a clean clone produces the documented output (one element validation per run is acceptable; full run is dev-only)
- [ ] All image files are 1280×960 sRGB JPEGs with file size ≤ 200 KB
- [ ] All `.license.json` files have a license value within the allowed set

## Pipeline Test: YES

Validate end-to-end on 5 hand-picked sample elements (H, Fe, Au, Xe, U):

```bash
npm run data:build -- --only h,fe,au,xe,u    # subset run
node -e "import('./src/lib/elements.js').then(m => Promise.all(['h','fe','au','xe','u'].map(s => m.loadElement(s)))).then(rs => { rs.forEach(r => console.log(r.symbol, r.name, r.electrons_per_shell.reduce((a,b)=>a+b,0))); process.exit(0); })"
```

Expected output: each element loads, validates, and `electrons_per_shell` sums correctly.

## Acceptance Criteria

- [ ] All 118 element JSON files exist and pass Zod validation
- [ ] Every element has at least the primary image, or `image_primary: null` (latter only for synthetic/unsourceable elements)
- [ ] Every image has a sibling `.license.json` with an allowed license
- [ ] `data/trivia/element-questions.json` exists with ≥600 questions
- [ ] `data/trivia/compound-questions.json` exists with ≥150 questions
- [ ] Re-running `build-trivia.ts` against unchanged element data produces byte-identical output (stable IDs)
- [ ] `npm run data:build` is documented in `pipelines/README.md` with env vars, runtime expectations, cost notes
- [ ] `loadAllElements` and `loadElement` are exported, typed, and used by Stage 3+ instead of direct fs reads

## Dependencies

- Depends on: Stage 1 (TypeScript setup, project structure)
- Can parallel with: none (serialized)

## Notes

- **Sub-agent prompts must be deterministic.** Use a structured template per element with the required fields explicitly listed. Validate the response shape before writing to disk.
- **Retry budget**: 3 attempts per element with exponential backoff (1s, 4s, 16s). Hard-fail if all 3 fail — don't ship partial data.
- **Citations** in `data.json` are encouraged for any non-obvious value (atomic mass, discovery year, isotope abundance). Aim for ≥3 citations per element minimum.
- **Wikimedia API** requires a `User-Agent` per their policy — use `Elements/0.1.0 (https://elements.seanmahoney.ai; <contact>)`.
- **Nano Banana Pro fallback prompt template** should produce photorealistic-but-clearly-illustrated images that respect the retro-science aesthetic. Document the prompt in `source-images.ts` so re-runs can reproduce.
- **Cost discipline**: a full pipeline run hits ~118 sub-agent calls plus image fetches/generations. Estimate cost before running; consider running once and committing — re-runs only when schema changes.
- **Stage 2 must not be re-run automatically in CI.** Add a CI guard: `npm run data:build` errors out unless `ALLOW_DATA_BUILD=1` is set.
- The placeholder `data/_placeholders/no-image.jpg` should be a generated retro-science-themed "image not available" plate (cream bg, ink text "NO IMAGE", double-rule border).
