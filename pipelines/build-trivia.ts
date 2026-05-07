/**
 * Trivia question bank generator.
 *
 * Pure local — reads data/elements/<symbol>/data.json files, generates ~5–8
 * questions per element across templated kinds, and writes:
 *   - data/trivia/element-questions.json
 *   - data/trivia/compound-questions.json
 *
 * Determinism: question IDs are stable across re-runs. Re-running against the
 * same input data must produce byte-identical output.
 *
 * Usage:
 *   npx tsx pipelines/build-trivia.ts
 *   npm run data:trivia
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ElementSchema, type Element } from '@/types/element';
import { QuestionBankSchema, type Question } from '@/types/trivia';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'data', 'elements');
const TRIVIA_DIR = join(REPO_ROOT, 'data', 'trivia');

// Deterministic build timestamp — only updated when data hashes change.
const BUILD_TS = '2026-05-06T00:00:00Z';

function loadAllElements(): Element[] {
  if (!existsSync(DATA_DIR)) return [];
  const dirs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  const out: Element[] = [];
  for (const dir of dirs) {
    const path = join(DATA_DIR, dir, 'data.json');
    if (!existsSync(path)) continue;
    const parsed = JSON.parse(readFileSync(path, 'utf-8'));
    out.push(ElementSchema.parse(parsed));
  }
  return out.sort((a, b) => a.atomic_number - b.atomic_number);
}

function categoryName(cat: Element['category']): string {
  const map: Record<Element['category'], string> = {
    'alkali-metal': 'Alkali metal',
    'alkaline-earth': 'Alkaline earth metal',
    'transition-metal': 'Transition metal',
    'post-transition': 'Post-transition metal',
    metalloid: 'Metalloid',
    nonmetal: 'Nonmetal',
    halogen: 'Halogen',
    'noble-gas': 'Noble gas',
    lanthanide: 'Lanthanide',
    actinide: 'Actinide',
    unknown: 'Unknown',
  };
  return map[cat];
}

function difficultyFor(el: Element): Question['difficulty'] {
  // Common/familiar elements → easy. Lanthanides/actinides/synthetics → hard.
  const easySymbols = new Set([
    'H', 'He', 'C', 'N', 'O', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'K', 'Ca',
    'Fe', 'Cu', 'Zn', 'Ag', 'Sn', 'I', 'Au', 'Hg', 'Pb',
  ]);
  if (easySymbols.has(el.symbol)) return 'easy';
  if (el.category === 'lanthanide' || el.category === 'actinide' || el.category === 'unknown') {
    return 'hard';
  }
  return 'medium';
}

function pickDistractors(
  pool: string[],
  answer: string,
  count: number,
  seed: number,
): string[] {
  // Deterministic selection: rotate by seed to vary across questions, drop the answer.
  const candidates = pool.filter((c) => c.toLowerCase() !== answer.toLowerCase());
  const ordered: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    ordered.push(candidates[(i + seed) % candidates.length]!);
  }
  // dedupe (case-insensitive)
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of ordered) {
    const k = c.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(c);
    if (out.length >= count) break;
  }
  return out;
}

function buildElementQuestions(elements: Element[]): Question[] {
  const out: Question[] = [];
  const allNames = elements.map((e) => e.name);
  const allSymbols = elements.map((e) => e.symbol);

  for (const el of elements) {
    const sym = el.symbol;
    const id = (kind: string, n: number) => `elem-${sym.toLowerCase()}-${kind}-${String(n).padStart(3, '0')}`;
    const diff = difficultyFor(el);

    // 1) symbol → "What is the symbol for X?"
    out.push({
      id: id('symbol', 1),
      type: 'element',
      subject_symbol: sym,
      prompt: `What is the chemical symbol for ${el.name}?`,
      prompt_kind: 'text',
      image_path: null,
      answer: sym,
      alternates: [sym.toLowerCase()],
      distractors: pickDistractors(allSymbols, sym, 3, el.atomic_number),
      explanation: `${el.name} (atomic number ${el.atomic_number}) uses the symbol ${sym}.`,
      difficulty: diff,
      tags: ['symbol', 'naming'],
    });

    // 2) name from symbol
    out.push({
      id: id('name', 1),
      type: 'element',
      subject_symbol: sym,
      prompt: `Which element has the chemical symbol ${sym}?`,
      prompt_kind: 'text',
      image_path: null,
      answer: el.name,
      alternates: [el.name.toLowerCase()],
      distractors: pickDistractors(allNames, el.name, 3, el.atomic_number + 7),
      explanation: `${sym} is the symbol for ${el.name} (atomic number ${el.atomic_number}).`,
      difficulty: diff,
      tags: ['symbol', 'naming'],
    });

    // 3) atomic number
    out.push({
      id: id('number', 1),
      type: 'element',
      subject_symbol: sym,
      prompt: `Which element has atomic number ${el.atomic_number}?`,
      prompt_kind: 'text',
      image_path: null,
      answer: el.name,
      alternates: [el.name.toLowerCase(), sym, sym.toLowerCase()],
      distractors: pickDistractors(allNames, el.name, 3, el.atomic_number + 13),
      explanation: `${el.name} (${sym}) has ${el.atomic_number} protons.`,
      difficulty: diff,
      tags: ['atomic-number'],
    });

    // 4) category
    out.push({
      id: id('category', 1),
      type: 'element',
      subject_symbol: sym,
      prompt: `Which category does ${el.name} belong to?`,
      prompt_kind: 'text',
      image_path: null,
      answer: categoryName(el.category),
      alternates: [categoryName(el.category).toLowerCase()],
      distractors: pickDistractors(
        ['Alkali metal', 'Alkaline earth metal', 'Transition metal', 'Post-transition metal',
         'Metalloid', 'Nonmetal', 'Halogen', 'Noble gas', 'Lanthanide', 'Actinide'],
        categoryName(el.category),
        3,
        el.atomic_number + 19,
      ),
      explanation: `${el.name} is classified as a ${categoryName(el.category).toLowerCase()}.`,
      difficulty: diff,
      tags: ['category'],
    });

    // 5) electron configuration short form
    out.push({
      id: id('config', 1),
      type: 'element',
      subject_symbol: sym,
      prompt: `Which element has the electron configuration ${el.electron_configuration_short}?`,
      prompt_kind: 'text',
      image_path: null,
      answer: el.name,
      alternates: [el.name.toLowerCase(), sym],
      distractors: pickDistractors(allNames, el.name, 3, el.atomic_number + 23),
      explanation: `${el.name} has the electron configuration ${el.electron_configuration_short}.`,
      difficulty: 'medium',
      tags: ['electron-config'],
    });

    // 6) photo (if available)
    if (el.image_primary) {
      out.push({
        id: id('photo', 1),
        type: 'element',
        subject_symbol: sym,
        prompt: 'Identify this element from its photograph.',
        prompt_kind: 'image',
        image_path: `/data/elements/${sym.toLowerCase()}/${el.image_primary}`,
        answer: el.name,
        alternates: [el.name.toLowerCase(), sym, sym.toLowerCase()],
        distractors: pickDistractors(allNames, el.name, 3, el.atomic_number + 29),
        explanation: el.image_alt
          ? `This is ${el.name} (${sym}). ${el.image_alt}.`
          : `This is ${el.name} (${sym}).`,
        difficulty: diff === 'hard' ? 'hard' : 'easy',
        tags: ['photo', 'identification'],
      });
    }
  }
  return out;
}

function buildCompoundQuestions(elements: Element[]): Question[] {
  // Collect all unique compounds across the data set.
  const compounds = new Map<string, { formula: string; name: string; summary: string }>();
  for (const el of elements) {
    for (const c of el.compounds) {
      if (!compounds.has(c.formula)) compounds.set(c.formula, c);
    }
  }
  const allNames = Array.from(compounds.values()).map((c) => c.name);
  const allFormulas = Array.from(compounds.keys());

  const out: Question[] = [];
  let idx = 0;
  for (const [formula, c] of compounds) {
    idx++;
    const slug = formula.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    out.push({
      id: `comp-${slug}-name-${String(idx).padStart(3, '0')}`,
      type: 'compound',
      subject_formula: formula,
      prompt: `What compound has the formula ${formula}?`,
      prompt_kind: 'text',
      image_path: null,
      answer: c.name,
      alternates: [c.name.toLowerCase()],
      distractors: pickDistractors(allNames, c.name, 3, idx),
      explanation: c.summary,
      difficulty: 'easy',
      tags: ['formula', 'compound'],
    });
    out.push({
      id: `comp-${slug}-formula-${String(idx).padStart(3, '0')}`,
      type: 'compound',
      subject_formula: formula,
      prompt: `What is the chemical formula for ${c.name}?`,
      prompt_kind: 'text',
      image_path: null,
      answer: formula,
      alternates: [formula.toLowerCase()],
      distractors: pickDistractors(allFormulas, formula, 3, idx + 7),
      explanation: c.summary,
      difficulty: 'medium',
      tags: ['formula', 'compound'],
    });
  }
  return out;
}

function main(): void {
  const elements = loadAllElements();
  if (elements.length === 0) {
    console.error('no element data found at data/elements/. run fetch-element-data.ts first.');
    process.exit(1);
  }

  const elemQuestions = buildElementQuestions(elements);
  const compQuestions = buildCompoundQuestions(elements);

  const elemBank = QuestionBankSchema.parse({
    schema_version: '1.0.0',
    generated_at: BUILD_TS,
    questions: elemQuestions,
  });
  const compBank = QuestionBankSchema.parse({
    schema_version: '1.0.0',
    generated_at: BUILD_TS,
    questions: compQuestions,
  });

  mkdirSync(TRIVIA_DIR, { recursive: true });
  writeFileSync(
    join(TRIVIA_DIR, 'element-questions.json'),
    JSON.stringify(elemBank, null, 2) + '\n',
  );
  writeFileSync(
    join(TRIVIA_DIR, 'compound-questions.json'),
    JSON.stringify(compBank, null, 2) + '\n',
  );

  console.log(
    `✓ trivia built: ${elemQuestions.length} element questions, ${compQuestions.length} compound questions`,
  );
}

main();
