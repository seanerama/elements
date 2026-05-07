import { describe, it, expect } from 'vitest';
import { splitFormula } from '@/lib/formula';

describe('splitFormula', () => {
  it('H2O → H, 2 (sub), O', () => {
    expect(splitFormula('H2O')).toEqual([
      { text: 'H', sub: false },
      { text: '2', sub: true },
      { text: 'O', sub: false },
    ]);
  });

  it('Fe2O3 → Fe, 2 (sub), O, 3 (sub)', () => {
    expect(splitFormula('Fe2O3')).toEqual([
      { text: 'Fe', sub: false },
      { text: '2', sub: true },
      { text: 'O', sub: false },
      { text: '3', sub: true },
    ]);
  });

  it('Na2SO4 splits each element', () => {
    const parts = splitFormula('Na2SO4');
    expect(parts.map((p) => p.text)).toEqual(['Na', '2', 'S', 'O', '4']);
    expect(parts.filter((p) => p.sub).map((p) => p.text)).toEqual(['2', '4']);
  });

  it('CO2 (single character + double-digit not present)', () => {
    expect(splitFormula('CO2').map((p) => p.text)).toEqual(['C', 'O', '2']);
  });

  it('handles single-element symbol', () => {
    expect(splitFormula('Au').map((p) => p.text)).toEqual(['Au']);
  });

  it('handles plain digit-less formula like NaCl', () => {
    expect(splitFormula('NaCl').map((p) => p.text)).toEqual(['Na', 'Cl']);
  });
});
