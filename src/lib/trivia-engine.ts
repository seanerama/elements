/**
 * Trivia engine — pure logic. No DOM, no React, no fetch.
 * UI bindings live in components that import from this module.
 *
 * Persistence (loadScores / saveScores) uses localStorage but is SSR-safe:
 * server-side calls return the sentinel default and don't throw.
 */

import { QuestionBankSchema, type Question } from '@/types/trivia';
import { mulberry32, shuffle } from './prng';

export type GameMode = 'element' | 'compound';

export interface GameState {
  mode: GameMode;
  questions: Question[];
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
  explanation: string;
  newState: GameState;
}

export interface CreateGameOpts {
  mode: GameMode;
  questionPool: Question[];
  shuffle?: boolean;
  filterBySymbol?: string;
  seed?: number;
  limit?: number;
}

export interface PersistedScore {
  bestStreak: number;
  highScore: number;
  totalGames: number;
  totalCorrect: number;
  totalAnswered: number;
  schema_version: '1.0.0';
}

const SENTINEL_SCORE: PersistedScore = {
  bestStreak: 0,
  highScore: 0,
  totalGames: 0,
  totalCorrect: 0,
  totalAnswered: 0,
  schema_version: '1.0.0',
};

const STORAGE_PREFIX = 'elements:trivia:';

export function createGame(opts: CreateGameOpts): GameState {
  const { mode, questionPool, filterBySymbol, seed, limit } = opts;
  const doShuffle = opts.shuffle ?? true;
  let pool = questionPool;
  if (filterBySymbol) {
    const sym = filterBySymbol;
    pool = pool.filter((q) => q.subject_symbol === sym || q.subject_symbol === sym.toUpperCase());
  }
  if (doShuffle) {
    const rng = mulberry32(seed ?? Date.now());
    pool = shuffle(pool, rng);
  }
  if (limit !== undefined && limit > 0) {
    pool = pool.slice(0, limit);
  }
  return {
    mode,
    questions: pool,
    currentIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    totalAnswered: 0,
    history: [],
  };
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function answer(state: GameState, userInput: string): AnswerResult {
  const q = state.questions[state.currentIndex];
  if (!q) {
    return {
      correct: false,
      expected: '',
      matched: null,
      explanation: 'No more questions.',
      newState: state,
    };
  }
  const lower = normalize(userInput);
  const isExact = normalize(q.answer) === lower;
  const isAlternate = q.alternates.some((a) => normalize(a) === lower);
  const correct = isExact || isAlternate;

  const newStreak = correct ? state.streak + 1 : 0;
  const newState: GameState = {
    ...state,
    score: correct ? state.score + 1 : state.score,
    streak: newStreak,
    bestStreak: Math.max(state.bestStreak, newStreak),
    totalAnswered: state.totalAnswered + 1,
    history: [
      ...state.history,
      { questionId: q.id, answeredCorrectly: correct, answer: userInput },
    ],
  };
  return {
    correct,
    expected: q.answer,
    matched: isExact ? 'exact' : isAlternate ? 'alternate' : null,
    explanation: q.explanation,
    newState,
  };
}

export function next(state: GameState): GameState {
  if (state.currentIndex >= state.questions.length) return state;
  return { ...state, currentIndex: state.currentIndex + 1 };
}

export function isComplete(state: GameState): boolean {
  return state.currentIndex >= state.questions.length;
}

// ---------- Question bank loading ----------

export async function loadElementQuestions(): Promise<Question[]> {
  const res = await fetch('/data/trivia/element-questions.json');
  const json = await res.json();
  return QuestionBankSchema.parse(json).questions;
}

export async function loadCompoundQuestions(): Promise<Question[]> {
  const res = await fetch('/data/trivia/compound-questions.json');
  const json = await res.json();
  return QuestionBankSchema.parse(json).questions;
}

// ---------- Persistence ----------

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadScores(mode: GameMode): PersistedScore {
  if (!isBrowser()) return { ...SENTINEL_SCORE };
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + mode);
    if (!raw) return { ...SENTINEL_SCORE };
    const parsed = JSON.parse(raw) as PersistedScore;
    if (parsed.schema_version !== '1.0.0') return { ...SENTINEL_SCORE };
    return {
      bestStreak: Number(parsed.bestStreak) || 0,
      highScore: Number(parsed.highScore) || 0,
      totalGames: Number(parsed.totalGames) || 0,
      totalCorrect: Number(parsed.totalCorrect) || 0,
      totalAnswered: Number(parsed.totalAnswered) || 0,
      schema_version: '1.0.0',
    };
  } catch {
    return { ...SENTINEL_SCORE };
  }
}

export function saveScores(mode: GameMode, score: PersistedScore): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + mode, JSON.stringify(score));
  } catch {
    // quota exceeded or other — silently drop; scores are best-effort
  }
}
