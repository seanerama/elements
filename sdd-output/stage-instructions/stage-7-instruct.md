# Stage 7: Standalone Game Pages

**Created by**: Project Planner
**Date**: 2026-05-06

## Objectives

- Build a `/games` index page (game picker)
- Build the standalone `/games/element` page ("Guess the Element")
- Build the standalone `/games/compound` page ("Guess the Compound")
- Reuse the trivia engine from Stage 6
- Provide a more "gamified" UI than the embedded widget: streak counter, persistent high score display, full-page wrong-answer wash, type-to-answer text input alongside multiple-choice
- Cover both games with end-to-end tests

## What to Build

### Files

- `src/pages/games/index.astro` — game picker, two big cards: "Guess the Element" and "Guess the Compound"; persistent high-streak display per game
- `src/pages/games/element.astro` — page shell for the element game; hosts `<ElementGame>` React island
- `src/pages/games/compound.astro` — page shell for the compound game; hosts `<CompoundGame>` React island
- `src/components/games/ElementGame.tsx` — React island, `client:load`. Owns full game state via `trivia-engine`. Photo or property-card prompt with text-input answer (with multiple-choice fallback toggle)
- `src/components/games/CompoundGame.tsx` — React island, `client:load`. Formula-to-name and name-to-formula questions. Mostly text input
- `src/components/games/GameHeader.tsx` — game eyebrow + score + streak counter (with Phosphor `Lightning` icon)
- `src/components/games/GameStage.tsx` — center-stage container per design spec; renders the question prompt, the answer input, the submit button
- `src/components/games/AnswerInput.tsx` — `<input type="text">` styled to design spec; handles Enter-to-submit
- `src/components/games/SubmitButton.tsx` — primary vermillion button, "SUBMIT" caps; loading state during answer evaluation
- `src/components/games/WrongOverlay.tsx` — full-page red wash (8% opacity, 200ms fade-in/fade-out) on wrong answer, plus the WRONG stamp on the input
- `src/components/games/GameResults.tsx` — end-of-round summary: final score, best streak, "Play again" / "Back to /games"
- `src/components/games/HighScoreDisplay.tsx` — small persistent score display on the `/games` index, reads from localStorage via `loadScores`
- `tests/e2e/games.spec.ts` — Playwright covering pipeline test below

### Components

(All listed under Files; no shared lib code beyond trivia-engine.)

## Interface Contracts

### Exposes

- Three new public routes: `/games`, `/games/element`, `/games/compound`

### Consumes

- **Trivia Engine API** (Stage 6) — `createGame`, `answer`, `next`, `isComplete`, `loadElementQuestions`, `loadCompoundQuestions`, `loadScores`, `saveScores`
- **Trivia Question Bank** (Stage 2) — indirect, via the engine
- **Design Tokens** (Stage 1) — all styling

## Testing Requirements

- [ ] Playwright: `/games` renders both game cards with current high-scores (or "—" if no plays yet)
- [ ] Playwright: `/games/element` flow:
  - Renders header "GUESS THE ELEMENT", score 0, streak 0
  - First question appears
  - Type wrong answer, click Submit → assert WRONG overlay, explanation, streak resets
  - Click "Next question" → second question appears
  - Type correct answer (case-insensitive, with whitespace) → assert ✓, score 1, streak 1
  - Continue; verify after a streak of 3, the streak counter shows 3 with Lightning icon
  - Complete a 10-question round (or stop early), verify game results page shows
  - Click "Play again" → new round starts with fresh state
- [ ] Playwright: `/games/compound` flow analogous
- [ ] Playwright: high score persists across page reloads (`localStorage` set + visible on `/games` index)
- [ ] Playwright: with `prefers-reduced-motion: reduce`, wrong-answer overlay fades in/out without rotation animation; stamp is instant
- [ ] Vitest (if any pure logic added): no new pure logic expected — all should live in trivia-engine (Stage 6)

## Pipeline Test: YES

Playwright pipeline test that plays through a complete game cycle:

1. Navigate to `/games`
2. Click "Guess the Element" card → URL is `/games/element`
3. Type the wrong answer for the first question, hit Enter → assert WRONG state, explanation visible
4. Click "Next" → next question
5. Inspect the prompt to determine the correct answer (or use `data-testid` exposed for the test); type it, hit Enter → assert correct state, score 1, streak 1
6. Repeat correct answers ×4 → assert streak counter shows 4 with Lightning icon
7. Open DevTools, inspect localStorage, assert `elements:trivia:element` key has bestStreak ≥ 4
8. Reload `/games` → assert "Guess the Element" card displays the saved best-streak
9. Repeat the analogous flow for `/games/compound`

## Acceptance Criteria

- [ ] Both games are playable end-to-end without errors
- [ ] Score and best-streak persist across reloads and across visits to `/games` index
- [ ] WRONG overlay covers the full viewport without scrolling, fades cleanly, doesn't trap clicks
- [ ] Streak counter resets to 0 on wrong answers and increments on correct ones
- [ ] Submit button is keyboard-accessible (Enter in input submits)
- [ ] Mobile / narrow desktop (≥1024px supported per MVP) layout doesn't break — game stage stays centered
- [ ] All animations respect `prefers-reduced-motion`
- [ ] No raw color/spacing in any game CSS — design tokens only

## Dependencies

- Depends on: Stage 6 (trivia engine + question banks)
- Can parallel with: none (serialized)

## Notes

- **Text input vs multiple-choice**: text input is the "default" for standalone games (more challenging, more satisfying). Provide a "Show options" toggle that falls back to 4 multiple-choice buttons for users who prefer it. Persist that preference in localStorage as `elements:trivia:input-mode`.
- **Streak Lightning icon** uses Phosphor `Lightning` Bold weight, `--color-accent-ochre`.
- **Round length**: default to 10 questions per round before showing results. Allow "Endless mode" toggle later (out of MVP scope).
- **Submit button states**: idle (vermillion solid) → submitting (vermillion + 60% opacity, no spinner needed) → result (briefly disabled while WRONG/CORRECT animation plays, then re-enabled for "Next").
- **Input clearing**: after each answer reveal, clear the input on "Next question" click; auto-focus the input.
- **Don't fork the trivia engine.** All game logic lives in `lib/trivia-engine.ts`. Game components only handle UI state, not gameplay state.
- **High-score on `/games` index** uses `loadScores` directly inside a tiny client island so it can update reactively after a game without a hard reload.
