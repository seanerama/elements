import { describe, it, expect } from 'vitest';
import { orbitalsForShells } from '@/lib/orbital-geometry';

describe('orbitalsForShells', () => {
  it('Hydrogen → 1 shell, 1 electron', () => {
    const s = orbitalsForShells([1]);
    expect(s.shells).toHaveLength(1);
    expect(s.shells[0]?.electrons).toHaveLength(1);
    expect(s.totalElectrons).toBe(1);
  });

  it('Oganesson → 7 shells, 118 electrons total', () => {
    const s = orbitalsForShells([2, 8, 18, 32, 32, 18, 8]);
    expect(s.shells).toHaveLength(7);
    expect(s.totalElectrons).toBe(118);
  });

  it('shell radii increase monotonically', () => {
    const s = orbitalsForShells([2, 8, 18, 32, 32, 18, 8]);
    for (let i = 1; i < s.shells.length; i++) {
      expect(s.shells[i]!.radius).toBeGreaterThan(s.shells[i - 1]!.radius);
    }
  });

  it('outer shells rotate slower than inner', () => {
    const s = orbitalsForShells([2, 8, 18, 32, 32, 18, 8]);
    for (let i = 1; i < s.shells.length; i++) {
      // speed should monotonically decrease (or stay equal) — outer shells slower
      expect(s.shells[i]!.speed).toBeLessThanOrEqual(s.shells[i - 1]!.speed);
    }
  });

  it('reduced motion sets all shell speeds to 0', () => {
    const s = orbitalsForShells([2, 8, 18, 32, 32, 18, 8], true);
    for (const sh of s.shells) {
      expect(sh.speed).toBe(0);
    }
  });

  it('handles 0-electron outer shell (Pd: [2,8,18,18,0])', () => {
    const s = orbitalsForShells([2, 8, 18, 18, 0]);
    expect(s.shells).toHaveLength(5);
    expect(s.shells[4]?.electrons).toHaveLength(0);
    expect(s.totalElectrons).toBe(46);
  });

  it('electron phase distributes evenly around shell circle', () => {
    const s = orbitalsForShells([8]);
    const phases = s.shells[0]!.electrons.map((e) => e.phase);
    expect(phases).toHaveLength(8);
    const expected = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
      Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4];
    phases.forEach((p, i) => {
      expect(p).toBeCloseTo(expected[i]!, 5);
    });
  });
});
