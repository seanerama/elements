/**
 * Client-side fuzzy search over all 118 elements via Fuse.js.
 * 118 elements is tiny — the index is ~30 KB and shipped in-page.
 */

import Fuse from 'fuse.js';
import type { Element } from '@/types/element';

/** Slimmed record actually shipped to the client (smaller than full Element). */
export interface SearchEntry {
  symbol: string;
  name: string;
  atomic_number: number;
  category: Element['category'];
}

export function toSearchEntries(elements: Element[]): SearchEntry[] {
  return elements.map((e) => ({
    symbol: e.symbol,
    name: e.name,
    atomic_number: e.atomic_number,
    category: e.category,
  }));
}

export function buildSearchIndex(entries: SearchEntry[]): Fuse<SearchEntry> {
  return new Fuse(entries, {
    keys: [
      { name: 'symbol', weight: 0.5 },
      { name: 'name', weight: 0.35 },
      { name: 'atomic_number', weight: 0.15 },
    ],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
}

/** Returns up to `limit` matches, ordered by Fuse score. */
export function searchEntries(index: Fuse<SearchEntry>, query: string, limit = 8): SearchEntry[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Pure numeric → atomic-number prefix lookup
  if (/^\d+$/.test(trimmed)) {
    const target = Number.parseInt(trimmed, 10);
    return index
      .getIndex()
      .docs.filter((d) => d.atomic_number.toString().startsWith(target.toString()))
      .slice(0, limit);
  }

  // 1-2 char alphabetic → symbol prefix match (faster than fuzzy + more correct)
  if (/^[A-Za-z]{1,2}$/.test(trimmed)) {
    const lower = trimmed.toLowerCase();
    const docs = index.getIndex().docs as SearchEntry[];
    const exact = docs.filter((d) => d.symbol.toLowerCase() === lower);
    const prefix = docs.filter(
      (d) => d.symbol.toLowerCase().startsWith(lower) && d.symbol.toLowerCase() !== lower,
    );
    const namePrefix = docs.filter((d) => d.name.toLowerCase().startsWith(lower));
    const seen = new Set<string>();
    const out: SearchEntry[] = [];
    for (const d of [...exact, ...prefix, ...namePrefix]) {
      if (seen.has(d.symbol)) continue;
      seen.add(d.symbol);
      out.push(d);
      if (out.length >= limit) return out;
    }
    if (out.length >= limit) return out;
    // fall through to fuzzy for additional matches
    const fuzzy = index.search(trimmed, { limit: limit - out.length }).map((r) => r.item);
    for (const d of fuzzy) {
      if (seen.has(d.symbol)) continue;
      seen.add(d.symbol);
      out.push(d);
      if (out.length >= limit) break;
    }
    return out;
  }

  return index.search(trimmed, { limit }).map((r) => r.item);
}
