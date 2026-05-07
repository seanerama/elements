import { describe, it, expect } from 'vitest';
import { buildGrid, nextSlot } from '@/lib/keyboard-nav';
import { ELEMENT_SEED } from '../../pipelines/element-seed';

const grid = buildGrid(
  ELEMENT_SEED.map((s) => ({
    atomic_number: s.atomic_number,
    symbol: s.symbol,
    period: s.period,
    group: s.group,
  })),
);

const bySymbol = new Map(grid.map((g) => [g.symbol, g]));

describe('keyboard-nav', () => {
  it('builds 118 grid slots', () => {
    expect(grid).toHaveLength(118);
  });

  it('Hydrogen sits at row 1, col 1', () => {
    const h = bySymbol.get('H');
    expect(h).toBeDefined();
    expect(h?.row).toBe(1);
    expect(h?.col).toBe(1);
  });

  it('Helium sits at row 1, col 18', () => {
    const he = bySymbol.get('He');
    expect(he?.col).toBe(18);
  });

  it('lanthanide Ce is in inner row 8 col 4', () => {
    const ce = bySymbol.get('Ce');
    expect(ce?.row).toBe(8);
    expect(ce?.col).toBe(4);
  });

  it('actinide Th is in inner row 9 col 4', () => {
    const th = bySymbol.get('Th');
    expect(th?.row).toBe(9);
    expect(th?.col).toBe(4);
  });

  it('ArrowRight from H goes to He', () => {
    const h = bySymbol.get('H')!;
    const next = nextSlot(h, 'ArrowRight', grid);
    expect(next?.symbol).toBe('He');
  });

  it('ArrowDown from H goes to Li', () => {
    const h = bySymbol.get('H')!;
    const next = nextSlot(h, 'ArrowDown', grid);
    expect(next?.symbol).toBe('Li');
  });

  it('ArrowDown from He goes to Ne (skipping empty groups 2-17 in row 2)', () => {
    const he = bySymbol.get('He')!;
    const next = nextSlot(he, 'ArrowDown', grid);
    expect(next?.symbol).toBe('Ne');
  });

  it('ArrowLeft from H returns null (boundary)', () => {
    const h = bySymbol.get('H')!;
    expect(nextSlot(h, 'ArrowLeft', grid)).toBeNull();
  });

  it('ArrowUp from H returns null (top edge)', () => {
    const h = bySymbol.get('H')!;
    expect(nextSlot(h, 'ArrowUp', grid)).toBeNull();
  });

  it('within lanthanide row, ArrowRight Ce → Pr', () => {
    const ce = bySymbol.get('Ce')!;
    const next = nextSlot(ce, 'ArrowRight', grid);
    expect(next?.symbol).toBe('Pr');
  });

  it('Lu (last lanthanide, col 17) ArrowRight returns null', () => {
    const lu = bySymbol.get('Lu')!;
    const next = nextSlot(lu, 'ArrowRight', grid);
    // col 18 has no slot in row 8, so should be null
    expect(next).toBeNull();
  });
});
