# Data pipeline

Builds the static data backing every element page, image, and trivia question.

> ⚠️ **Manual / dev-machine only.** This pipeline is **never** run in CI. Each script
> requires `ALLOW_DATA_BUILD=1` to refuse accidental invocation.

## Output

```
data/
├── elements/
│   ├── h/
│   │   ├── data.json
│   │   └── images/
│   │       ├── sample.jpg
│   │       └── sample.license.json
│   ├── ... (118 element folders)
└── trivia/
    ├── element-questions.json
    └── compound-questions.json
```

All output is committed to the repo. Re-run the pipeline only when:
- Schema bumps (`schema_version`)
- Adding/refreshing images for specific elements
- Adding new trivia question kinds

## Scripts

| Script                       | What it does                                                         |
|------------------------------|----------------------------------------------------------------------|
| `fetch-element-data.ts`      | Drives sub-agents to research + write `data/elements/*/data.json`    |
| `source-images.ts`           | Wikimedia Commons → image + license sidecar; flags failures          |
| `build-trivia.ts`            | Pure local — reads element JSON, emits trivia banks (deterministic)  |
| `run-all.ts`                 | Runs all three in order                                              |
| `element-seed.ts`            | The 118-element seed list (atomic #, symbol, name, category, …)      |
| `lib/element-research-prompt.ts` | Canonical research prompt used by every sub-agent                |
| `lib/sub-agent.ts`           | Anthropic SDK wrapper with retry + schema validation                 |

## Required env

| Variable                | Used by                       | Notes |
|-------------------------|-------------------------------|-------|
| `ALLOW_DATA_BUILD=1`    | All scripts                   | Hard guard — refuses to run otherwise |
| `ANTHROPIC_API_KEY`     | `fetch-element-data.ts`       | One per developer; never commit |
| `WIKIMEDIA_USER_AGENT`  | `source-images.ts`            | Per Wikimedia API policy: must include project name + contact |

Install the optional dev dep before running data fetch:

```bash
npm i -D @anthropic-ai/sdk
```

## Stage-2 first-build note

The initial population of `data/elements/` was driven from a Claude Code session
using parallel sub-agents (one per category). The infrastructure above mirrors
that orchestration so a future maintainer can re-run individual elements
(`--only=h,fe,au`) without firing up the full pipeline by hand.

For elements where Wikimedia returns no acceptable photo, the `nano-banana`
Claude Code skill is the documented fallback — invoked manually from a session
that has the skill loaded.

## Deterministic re-runs

`build-trivia.ts` produces byte-identical output for a given input data set.
Verify with:

```bash
npm run data:trivia
git diff --exit-code data/trivia/
```

If the diff is clean, the script is deterministic. If not, investigate before
committing.
