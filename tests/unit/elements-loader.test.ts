import { describe, it, expect, beforeEach } from 'vitest';
import { loadAllElements, loadElement, _clearElementCache } from '@/lib/elements';
import { ELEMENT_SEED } from '../../pipelines/element-seed';

describe('elements loader', () => {
  beforeEach(() => {
    _clearElementCache();
  });

  it('loadAllElements returns all 118 elements', () => {
    const all = loadAllElements();
    expect(all).toHaveLength(118);
  });

  it('elements are sorted by atomic number', () => {
    const all = loadAllElements();
    for (let i = 0; i < all.length; i++) {
      expect(all[i]!.atomic_number).toBe(i + 1);
    }
  });

  it('every element passes schema validation', () => {
    // loadAllElements throws on invalid data, so reaching this point passes
    expect(() => loadAllElements()).not.toThrow();
  });

  it('electrons_per_shell sums to atomic_number for every element', () => {
    const all = loadAllElements();
    for (const el of all) {
      const sum = el.electrons_per_shell.reduce((a, b) => a + b, 0);
      expect(sum, `${el.symbol} (${el.name}) shells sum`).toBe(el.atomic_number);
    }
  });

  it('every element matches the seed list (number, symbol, name, category, period, block)', () => {
    const all = loadAllElements();
    const byNumber = new Map(all.map((e) => [e.atomic_number, e]));
    for (const seed of ELEMENT_SEED) {
      const found = byNumber.get(seed.atomic_number);
      expect(found, `seed ${seed.symbol} (#${seed.atomic_number}) missing`).toBeDefined();
      expect(found!.symbol).toBe(seed.symbol);
      expect(found!.name).toBe(seed.name);
      expect(found!.category).toBe(seed.category);
      expect(found!.period).toBe(seed.period);
      expect(found!.block).toBe(seed.block);
    }
  });

  it('loadElement returns Hydrogen by symbol (case-insensitive)', () => {
    const h1 = loadElement('h');
    const h2 = loadElement('H');
    expect(h1).not.toBeNull();
    expect(h2).not.toBeNull();
    expect(h1!.name).toBe('Hydrogen');
    expect(h1!.atomic_number).toBe(1);
  });

  it('loadElement returns null for unknown symbol', () => {
    const x = loadElement('xx');
    expect(x).toBeNull();
  });

  it('loadElement returns Gold (Au, atomic 79)', () => {
    const au = loadElement('au');
    expect(au).not.toBeNull();
    expect(au!.symbol).toBe('Au');
    expect(au!.atomic_number).toBe(79);
    expect(au!.category).toBe('transition-metal');
  });

  it('loadElement returns Oganesson (Og, atomic 118)', () => {
    const og = loadElement('og');
    expect(og).not.toBeNull();
    expect(og!.atomic_number).toBe(118);
    expect(og!.atomic_mass_uncertain).toBe(true);
    expect(og!.occurrence.natural).toBe(false);
  });

  it('every element has at least 3 citations', () => {
    const all = loadAllElements();
    for (const el of all) {
      expect(el.citations.length, `${el.symbol} citations`).toBeGreaterThanOrEqual(3);
    }
  });

  it('symbols are unique across all 118 elements', () => {
    const all = loadAllElements();
    const symbols = new Set(all.map((e) => e.symbol));
    expect(symbols.size).toBe(118);
  });

  it('atomic numbers are 1..118 with no gaps', () => {
    const all = loadAllElements();
    const nums = all.map((e) => e.atomic_number).sort((a, b) => a - b);
    for (let i = 0; i < 118; i++) {
      expect(nums[i]).toBe(i + 1);
    }
  });
});
