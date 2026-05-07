/**
 * Element data loader — the only module Stages 3, 4, 6 should use to read
 * per-element JSON. Validates against the Zod schema on load.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ElementSchema, type Element } from '@/types/element';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', '..', 'data', 'elements');

let _cache: Element[] | null = null;

function readElementFile(symbolDir: string): Element {
  const dataPath = join(DATA_DIR, symbolDir, 'data.json');
  const raw = readFileSync(dataPath, 'utf-8');
  const parsed = JSON.parse(raw);
  const result = ElementSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      `Element schema validation failed for ${symbolDir}: ${result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')}`,
    );
  }
  return result.data;
}

/**
 * Load all 118 elements (or whatever exists in data/elements/).
 * Throws on the first schema violation.
 */
export function loadAllElements(): Element[] {
  if (_cache) return _cache;
  if (!existsSync(DATA_DIR)) {
    return [];
  }
  const dirs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const elements = dirs.map(readElementFile).sort((a, b) => a.atomic_number - b.atomic_number);
  _cache = elements;
  return elements;
}

/**
 * Load a single element by symbol (case-insensitive).
 * Returns null if no folder exists.
 */
export function loadElement(symbol: string): Element | null {
  const lower = symbol.toLowerCase();
  const dataPath = join(DATA_DIR, lower, 'data.json');
  if (!existsSync(dataPath)) {
    return null;
  }
  return readElementFile(lower);
}

/** Test-only: drop the in-memory cache. */
export function _clearElementCache(): void {
  _cache = null;
}
