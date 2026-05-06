# Interface Contract: Trivia Engine API

**Between**: Stage 6 (Trivia Engine library) → Stage 7 (Game Pages)
**Created**: 2026-05-06

## Provider (Stage 6)

### Exports

Pure TypeScript module at `src/lib/trivia-engine.ts`. No DOM, no React, no fetch — pure logic. UI bindings live in components that import from this module.

### Public API

```typescript
import type { Question } from '@/types/trivia';

export type GameMode = 'element' | 'compound';

export interface GameState {
  mode: GameMode;
  questions: Question[];        // ordered list (already shuffled if game requested)
  currentIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  totalAnswered: number;
  history: Array<{
    questionId: string;
    answeredCorrectly: boolean;
    answer: string;
  }>;
}

export interface AnswerResult {
  correct: boolean;
  expected: string;
  matched: 'exact' | 'alternate' | null;
  explanation: string;          // shown after a wrong answer
  newState: GameState;
}

// --- creation / loading ---
export function createGame(opts: {
  mode: GameMode;
  questionPool: Question[];
  shuffle?: boolean;            // default: true
  filterBySymbol?: string;      // for embedded widget — restricts to one element
  seed?: number;                // for testability and "share this game" later
}): GameState;

export function loadElementQuestions(): Promise<Question[]>;
export function loadCompoundQuestions(): Promise<Question[]>;

// --- gameplay ---
export function answer(state: GameState, userInput: string): AnswerResult;
export function next(state: GameState): GameState;        // advance currentIndex
export function isComplete(state: GameState): boolean;    // currentIndex >= questions.length

// --- persistence ---
export interface PersistedScore {
  bestStreak: number;
  highScore: number;
  totalGames: number;
  totalCorrect: number;
  totalAnswered: number;
}

export function loadScores(mode: GameMode): PersistedScore;
export function saveScores(mode: GameMode, score: PersistedScore): void;
```

### Behavior Guarantees

- **Pure functions**: `createGame`, `answer`, `next`, `isComplete` are deterministic given the same inputs. No mutation of arguments.
- **Answer matching**: case-insensitive trim against `question.answer` and `question.alternates`. Returns `'exact'` for `answer` match, `'alternate'` for `alternates` match, `null` for miss.
- **Streak math**: `streak` increments on correct, resets to 0 on incorrect. `bestStreak = max(bestStreak, streak)`.
- **Persistence**: `loadScores` / `saveScores` use `localStorage` keys `elements:trivia:<mode>`. SSR-safe (returns sentinel on server, no-ops on save).

### Storage Schema

`localStorage` key `elements:trivia:element` and `elements:trivia:compound`:

```json
{
  "schema_version": "1.0.0",
  "bestStreak": 12,
  "highScore": 47,
  "totalGames": 8,
  "totalCorrect": 142,
  "totalAnswered": 200
}
```

A version mismatch causes the engine to discard old data silently and start fresh.

## Consumer (Stage 7)

### Imports

```typescript
import {
  createGame,
  answer,
  next,
  isComplete,
  loadElementQuestions,
  loadScores,
  saveScores,
  type GameState
} from '@/lib/trivia-engine';
```

### Usage Pattern

```typescript
const pool = await loadElementQuestions();
let state = createGame({ mode: 'element', questionPool: pool, shuffle: true });

// in input handler:
const result = answer(state, userInput);
if (result.correct) { /* show correct UI */ }
else { /* show wrong UI + result.explanation */ }
state = result.newState;

// on "next":
state = next(state);
if (isComplete(state)) {
  saveScores('element', { /* ... */ });
}
```

## Validation

- [ ] `src/lib/trivia-engine.ts` exports the entire public API surface above
- [ ] All functions have ≥80% unit test coverage in Vitest, including edge cases (empty pool, completed game, case mismatch, alternates, no-op next at end)
- [ ] `createGame` with the same `seed` produces the same `questions` order across runs
- [ ] `answer` does not mutate the input `state` (verified by deep-freeze test)
- [ ] `loadScores` returns sentinel default on server-side / when localStorage missing or corrupt
- [ ] SSR build of an element page that uses the embedded widget does not throw (no localStorage access in render path)
