import { describe, it, expect } from 'vitest';
import { buildSearchIndex, searchEntries, toSearchEntries } from '@/lib/search';
import { loadAllElements } from '@/lib/elements';

const entries = toSearchEntries(loadAllElements());
const idx = buildSearchIndex(entries);

describe('search', () => {
  it('exact symbol match: "H" returns Hydrogen first', () => {
    const r = searchEntries(idx, 'H', 5);
    expect(r[0]?.symbol).toBe('H');
    expect(r[0]?.name).toBe('Hydrogen');
  });

  it('exact symbol match: "Au" returns Gold first', () => {
    const r = searchEntries(idx, 'Au', 5);
    expect(r[0]?.symbol).toBe('Au');
    expect(r[0]?.name).toBe('Gold');
  });

  it('case-insensitive: "au" same as "Au"', () => {
    const r = searchEntries(idx, 'au', 5);
    expect(r[0]?.symbol).toBe('Au');
  });

  it('atomic number prefix: "1" returns Hydrogen + others starting with 1', () => {
    const r = searchEntries(idx, '1', 8);
    expect(r.some((e) => e.atomic_number === 1)).toBe(true);
  });

  it('exact atomic number: "79" returns Gold', () => {
    const r = searchEntries(idx, '79', 5);
    expect(r.some((e) => e.atomic_number === 79 && e.symbol === 'Au')).toBe(true);
  });

  it('partial name fuzzy: "gold" returns Gold', () => {
    const r = searchEntries(idx, 'gold', 5);
    expect(r[0]?.name).toBe('Gold');
  });

  it('partial name fuzzy: "hyd" returns Hydrogen', () => {
    const r = searchEntries(idx, 'hyd', 5);
    expect(r[0]?.name).toBe('Hydrogen');
  });

  it('returns empty array on empty query', () => {
    expect(searchEntries(idx, '')).toEqual([]);
    expect(searchEntries(idx, '   ')).toEqual([]);
  });

  it('limit param caps results', () => {
    const r = searchEntries(idx, 'a', 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });
});
