import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { QuestionBankSchema } from '@/types/trivia';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');

function loadBank(filename: string) {
  const raw = readFileSync(resolve(repoRoot, 'data', 'trivia', filename), 'utf-8');
  return QuestionBankSchema.parse(JSON.parse(raw));
}

describe('trivia banks', () => {
  it('element bank parses against schema', () => {
    const bank = loadBank('element-questions.json');
    expect(bank.questions.length).toBeGreaterThan(0);
  });

  it('compound bank parses against schema', () => {
    const bank = loadBank('compound-questions.json');
    expect(bank.questions.length).toBeGreaterThan(0);
  });

  it('every element question has at least 3 distractors', () => {
    const bank = loadBank('element-questions.json');
    for (const q of bank.questions) {
      expect(q.distractors.length, `${q.id}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('answer is never present in distractors (case-insensitive)', () => {
    const bank = loadBank('element-questions.json');
    for (const q of bank.questions) {
      const lower = q.answer.toLowerCase();
      expect(q.distractors.map((d) => d.toLowerCase())).not.toContain(lower);
    }
  });

  it('question IDs are globally unique', () => {
    const a = loadBank('element-questions.json');
    const b = loadBank('compound-questions.json');
    const ids = new Set([...a.questions.map((q) => q.id), ...b.questions.map((q) => q.id)]);
    expect(ids.size).toBe(a.questions.length + b.questions.length);
  });

  it('element questions cover all 118 elements (≥1 question each)', () => {
    const bank = loadBank('element-questions.json');
    const symbols = new Set(bank.questions.map((q) => q.subject_symbol).filter(Boolean));
    expect(symbols.size).toBe(118);
  });

  it('element questions have ≥5 per element on average', () => {
    const bank = loadBank('element-questions.json');
    expect(bank.questions.length).toBeGreaterThanOrEqual(118 * 5);
  });

  it('compound questions reference real compounds', () => {
    const bank = loadBank('compound-questions.json');
    for (const q of bank.questions) {
      expect(q.subject_formula, q.id).toBeTruthy();
      expect(q.type).toBe('compound');
    }
  });
});
