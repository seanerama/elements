# Stage 6: Trivia Engine + Embedded Widget

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Build the pure TypeScript trivia engine library (`src/lib/trivia-engine.ts`) per the engine API contract
- Build the embedded `<TriviaWidget>` React island that surfaces 3–5 random questions specific to the current element on every detail page
- Implement localStorage persistence of high score / streak per game mode
- Handle correct/wrong UI states with stamps + ✓ icons per design system
- Provide question-bank loaders (`loadElementQuestions`, `loadCompoundQuestions`)

## What to Build

### Files

- `src/types/trivia.ts` — already created in Stage 2 for the question shape; add `GameState`, `AnswerResult`, `PersistedScore`, `GameMode` types here
- `src/lib/trivia-engine.ts` — pure logic per `contracts/trivia-engine-api.md`: `createGame`, `answer`, `next`, `isComplete`, `loadElementQuestions`, `loadCompoundQuestions`, `loadScores`, `saveScores`. Uses a seedable PRNG (e.g., mulberry32) for `shuffle` + `seed` determinism. `loadScores` is SSR-safe (returns sentinel default when `typeof window === 'undefined'`)
- `src/lib/prng.ts` — seedable PRNG utility (mulberry32 or similar, ~10 lines)
- `src/components/TriviaWidget.tsx` — React island, hydrate `client:visible`. Props: `subjectSymbol: string`, `mode: 'element'`. Loads questions for the symbol on mount, walks 3–5 questions, persists score on completion. Handles correct/wrong animations per design spec
- `src/components/TriviaWidget.module.css` — scoped styles using design tokens
- `src/components/trivia/QuestionView.tsx` — sub-component: renders question text or photo + 4 answer-button options
- `src/components/trivia/AnswerButton.tsx` — sub-component: secondary-style button with correct/wrong state animations
- `src/components/trivia/WrongStamp.tsx` — vermillion "WRONG" stamp animation overlaid on a wrongly-clicked answer; uses CSS keyframes (200ms ease-out + 4° rotation, then settle)
- `tests/unit/trivia-engine.test.ts` — Vitest covering the full engine API: createGame determinism with seed, answer-matching (exact/alternate/case/whitespace), no mutation, streak math, completion detection
- `tests/unit/prng.test.ts` — Vitest: same seed produces same sequence; different seeds diverge
- `tests/e2e/embedded-trivia.spec.ts` — Playwright covering pipeline test below

### Components

- `TriviaWidget.tsx` — primary island integrating with element detail pages
- `QuestionView.tsx`, `AnswerButton.tsx`, `WrongStamp.tsx` — internal sub-components

### Integration Point

In `src/pages/elements/[symbol].astro`, mount the widget below the detail cards and above the prev/next nav:

```astro
<TriviaWidget client:visible mode="element" subjectSymbol={element.symbol} />
```

## Interface Contracts

### Exposes

- **Trivia Engine API** (`contracts/trivia-engine-api.md`) — for Stage 7 to consume
- The embedded widget is consumed by Stage 4's element detail page (added retroactively in this stage's integration step)

### Consumes

- **Element Schema** (Stage 2) — only via the question's `subject_symbol` link, no direct element data needed
- **Trivia Question Bank** (Stage 2) — loaded via `loadElementQuestions()`
- **Design Tokens** (Stage 1) — all styling

## Testing Requirements

- [ ] Vitest: `createGame({ mode, questionPool, shuffle: true, seed: 42 })` produces same `questions` order across two calls with the same seed
- [ ] Vitest: `answer(state, "h")` returns `correct: true` for a question where answer is "H" (case-insensitive)
- [ ] Vitest: `answer(state, "  hydrogen  ")` matches "Hydrogen" (trim + case-insensitive)
- [ ] Vitest: `answer(state, "wrong")` returns `correct: false`, includes `explanation`, `newState.streak === 0`, `newState.score` unchanged
- [ ] Vitest: `next(completedState)` at `currentIndex === questions.length - 1` advances to length and `isComplete(state)` returns true
- [ ] Vitest: deep-freezing the input `state` and calling `answer` does not throw (purity check)
- [ ] Vitest: `loadScores('element')` returns sentinel default when localStorage is unavailable (`window === undefined`)
- [ ] Vitest: `saveScores` then `loadScores` round-trips correctly
- [ ] Vitest: `loadScores` ignores corrupt JSON / wrong schema_version and returns sentinel
- [ ] Playwright: visit `/elements/h`, scroll to widget, assert it loads with a question prompt
- [ ] Playwright: click correct answer → assert ✓ icon appears, score increments
- [ ] Playwright: click wrong answer → assert vermillion "WRONG" stamp appears, explanation shows
- [ ] Playwright: refresh page, score persisted and visible

## Pipeline Test: YES

Playwright pipeline test:

1. Navigate to `/elements/c`
2. Scroll to embedded trivia widget
3. Assert it renders with a question about Carbon (e.g., "What's the symbol for Carbon?")
4. Click an answer; if correct → assert ✓ icon, score increments to 1; if wrong → assert ✗ stamp + explanation
5. Click "Next question" (or auto-advance if implemented)
6. Repeat for 3 questions
7. After widget completes, refresh page; assert previously-stored high-streak persisted
8. Open DevTools → Application → localStorage → confirm `elements:trivia:element` key exists with correct schema

## Acceptance Criteria

- [ ] All trivia-engine-api contract validation checkboxes pass
- [ ] Embedded widget renders on all 118 element detail pages without errors
- [ ] Correct/wrong animations match design spec (no springs, ease-out, 200–250ms)
- [ ] Score persists across page reloads and across sessions
- [ ] Widget gracefully handles elements with too few questions (e.g., synthetic elements with limited data) — minimum question count threshold; if below, widget shows a "More questions coming soon" stub instead of breaking
- [ ] All trivia-engine functions are 100% deterministic given inputs (verified by seed test)
- [ ] No SSR errors on any element page (widget is `client:visible`, never renders during SSR)
- [ ] Total widget bundle ≤ 25 KB gzipped (engine + components, excluding React itself)

## Dependencies

- Depends on: Stage 1 (foundation), Stage 2 (data + question bank), Stage 4 (element detail pages to embed into)
- Can parallel with: none (serialized)

## Notes

- **Engine purity is non-negotiable.** No DOM access, no React, no `fetch`, no `localStorage` inside `createGame` / `answer` / `next` / `isComplete`. localStorage I/O lives in `loadScores` / `saveScores` only, behind a runtime check.
- **The seed parameter** lets future features ship a "Daily challenge: 5 questions, same for everyone today" without re-architecting. Cheap insurance.
- **Question shuffling** uses Fisher-Yates with the seedable PRNG. Don't `.sort(() => Math.random() - 0.5)` — biased.
- **Embedded widget vs standalone game** share the same engine. Stage 7 will reuse it. Don't fork the engine for game-specific concerns; pass options.
- **Wrong-answer stamp**: CSS-only animation, no JS. Use `transform: rotate(4deg) scale(1)` keyframe.
- **Accessibility**: each answer button is a real `<button>` (not a div); ✓/✗ icons have `aria-hidden`; the stamp has `aria-live="polite"` text "Incorrect — explanation follows"; explanation is in a `<p>` below the buttons.
- **Stage 4 integration**: this stage adds an `import` and a JSX line to `src/pages/elements/[symbol].astro`. Treat it as part of Stage 6's deliverable — Stage 4's tests will need to be re-run after this integration to confirm no regressions.
