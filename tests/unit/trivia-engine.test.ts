import { describe, it, expect } from 'vitest';
import {
  createGame,
  answer,
  next,
  isComplete,
  loadScores,
  saveScores,
  type GameState,
  type PersistedScore,
} from '@/lib/trivia-engine';
import type { Question } from '@/types/trivia';
import { mulberry32, shuffle } from '@/lib/prng';

const SAMPLE: Question[] = [
  {
    id: 'elem-h-symbol-001',
    type: 'element',
    subject_symbol: 'H',
    prompt: 'What is the chemical symbol for Hydrogen?',
    prompt_kind: 'text',
    image_path: null,
    answer: 'H',
    alternates: ['hydrogen-1', 'protium'],
    distractors: ['He', 'Hg', 'Hf'],
    explanation: 'Hydrogen uses H.',
    difficulty: 'easy',
    tags: [],
  },
  {
    id: 'elem-h-name-001',
    type: 'element',
    subject_symbol: 'H',
    prompt: 'Which element has the symbol H?',
    prompt_kind: 'text',
    image_path: null,
    answer: 'Hydrogen',
    alternates: ['element 1'],
    distractors: ['Helium', 'Hafnium', 'Holmium'],
    explanation: 'H is hydrogen.',
    difficulty: 'easy',
    tags: [],
  },
];

describe('mulberry32 PRNG', () => {
  it('same seed produces same sequence', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 10; i++) {
      expect(a()).toBe(b());
    }
  });

  it('different seeds diverge', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let diverged = false;
    for (let i = 0; i < 5; i++) {
      if (a() !== b()) diverged = true;
    }
    expect(diverged).toBe(true);
  });
});

describe('shuffle', () => {
  it('preserves length', () => {
    const out = shuffle([1, 2, 3, 4, 5], mulberry32(7));
    expect(out).toHaveLength(5);
  });

  it('does not mutate input', () => {
    const input = [1, 2, 3];
    const inputBefore = [...input];
    shuffle(input, mulberry32(7));
    expect(input).toEqual(inputBefore);
  });

  it('same seed = same order', () => {
    const a = shuffle(['a', 'b', 'c', 'd'], mulberry32(99));
    const b = shuffle(['a', 'b', 'c', 'd'], mulberry32(99));
    expect(a).toEqual(b);
  });
});

describe('createGame', () => {
  it('seeded game produces deterministic question order', () => {
    const a = createGame({ mode: 'element', questionPool: SAMPLE, shuffle: true, seed: 42 });
    const b = createGame({ mode: 'element', questionPool: SAMPLE, shuffle: true, seed: 42 });
    expect(a.questions.map((q) => q.id)).toEqual(b.questions.map((q) => q.id));
  });

  it('without shuffle preserves input order', () => {
    const a = createGame({ mode: 'element', questionPool: SAMPLE, shuffle: false });
    expect(a.questions[0]?.id).toBe(SAMPLE[0]!.id);
  });

  it('filterBySymbol restricts pool', () => {
    const big: Question[] = [
      { ...SAMPLE[0]!, id: '1', subject_symbol: 'H' },
      { ...SAMPLE[0]!, id: '2', subject_symbol: 'He' },
      { ...SAMPLE[0]!, id: '3', subject_symbol: 'H' },
    ];
    const game = createGame({
      mode: 'element',
      questionPool: big,
      shuffle: false,
      filterBySymbol: 'H',
    });
    expect(game.questions).toHaveLength(2);
  });

  it('limit caps the question count', () => {
    const game = createGame({ mode: 'element', questionPool: SAMPLE, shuffle: false, limit: 1 });
    expect(game.questions).toHaveLength(1);
  });

  it('initial state is zeroed', () => {
    const game = createGame({ mode: 'element', questionPool: SAMPLE });
    expect(game.score).toBe(0);
    expect(game.streak).toBe(0);
    expect(game.bestStreak).toBe(0);
    expect(game.totalAnswered).toBe(0);
    expect(game.currentIndex).toBe(0);
    expect(game.history).toEqual([]);
  });
});

describe('answer', () => {
  let game: GameState;
  beforeEach(() => {
    game = createGame({ mode: 'element', questionPool: SAMPLE, shuffle: false });
  });

  it('exact match returns correct=true with matched="exact"', () => {
    const r = answer(game, 'H');
    expect(r.correct).toBe(true);
    expect(r.matched).toBe('exact');
    expect(r.newState.score).toBe(1);
    expect(r.newState.streak).toBe(1);
  });

  it('alternate match returns correct=true with matched="alternate"', () => {
    const r = answer(game, 'protium');
    expect(r.correct).toBe(true);
    expect(r.matched).toBe('alternate');
  });

  it('case-insensitive + trim', () => {
    const r = answer(game, '  H  ');
    expect(r.correct).toBe(true);
  });

  it('wrong answer returns correct=false, no score, streak resets', () => {
    let s = answer(game, 'H').newState; // streak now 1
    s = next(s);
    const r = answer(s, 'XYZ');
    expect(r.correct).toBe(false);
    expect(r.newState.score).toBe(1); // unchanged
    expect(r.newState.streak).toBe(0);
  });

  it('does not mutate input state', () => {
    const frozen = Object.freeze({ ...game, history: Object.freeze([...game.history]) });
    expect(() => answer(frozen as GameState, 'H')).not.toThrow();
  });

  it('explanation surfaces from question.explanation', () => {
    const r = answer(game, 'wrong');
    expect(r.explanation).toBe('Hydrogen uses H.');
  });

  it('beyond final question is graceful', () => {
    let s = game;
    for (let i = 0; i < SAMPLE.length; i++) {
      s = answer(s, 'wrong').newState;
      s = next(s);
    }
    const r = answer(s, 'anything');
    expect(r.correct).toBe(false);
    expect(r.explanation).toBe('No more questions.');
  });
});

describe('streak math', () => {
  it('bestStreak grows over correct answers and persists when streak resets', () => {
    // Use a 3-question pool so we can: correct, correct, wrong — and verify
    // streak resets on wrong while bestStreak stays at the peak.
    const pool = [SAMPLE[0]!, SAMPLE[1]!, { ...SAMPLE[0]!, id: 'q3', answer: 'X', alternates: [] }];
    let s = createGame({ mode: 'element', questionPool: pool, shuffle: false });
    s = answer(s, 'H').newState; // q[0] correct, streak 1
    s = next(s);
    s = answer(s, 'Hydrogen').newState; // q[1] correct, streak 2, best 2
    expect(s.bestStreak).toBe(2);
    expect(s.streak).toBe(2);
    s = next(s);
    s = answer(s, 'wrong').newState; // q[2] wrong → streak resets, best stays 2
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
  });
});

describe('isComplete', () => {
  it('false when not all questions answered', () => {
    const g = createGame({ mode: 'element', questionPool: SAMPLE, shuffle: false });
    expect(isComplete(g)).toBe(false);
  });

  it('true after advancing past final question', () => {
    let g = createGame({ mode: 'element', questionPool: SAMPLE, shuffle: false });
    for (let i = 0; i < SAMPLE.length; i++) g = next(g);
    expect(isComplete(g)).toBe(true);
  });
});

describe('persistence (localStorage)', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage?.clear();
    }
  });

  it('loadScores returns sentinel when localStorage missing (server)', () => {
    // In Vitest node env, window is undefined
    const sentinel = loadScores('element');
    expect(sentinel.bestStreak).toBe(0);
    expect(sentinel.totalGames).toBe(0);
  });

  it('save/load round-trips when window stub provided', () => {
    const store = new Map<string, string>();
    const win = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
        clear: () => store.clear(),
      },
    };
     
    (globalThis as any).window = win;
    const before: PersistedScore = {
      bestStreak: 7,
      highScore: 42,
      totalGames: 3,
      totalCorrect: 100,
      totalAnswered: 130,
      schema_version: '1.0.0',
    };
    saveScores('element', before);
    const after = loadScores('element');
    expect(after).toEqual(before);
     
    delete (globalThis as any).window;
  });

  it('loadScores ignores corrupt JSON', () => {
    const store = new Map<string, string>();
    store.set('elements:trivia:element', '{not json');
     
    (globalThis as any).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      } as unknown as Storage,
    };
    const result = loadScores('element');
    expect(result.bestStreak).toBe(0);
     
    delete (globalThis as any).window;
  });

  it('loadScores rejects wrong schema_version', () => {
    const store = new Map<string, string>();
    store.set(
      'elements:trivia:element',
      JSON.stringify({ schema_version: '0.5.0', bestStreak: 99 }),
    );
     
    (globalThis as any).window = {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      } as unknown as Storage,
    };
    const result = loadScores('element');
    expect(result.bestStreak).toBe(0); // discarded
     
    delete (globalThis as any).window;
  });
});
