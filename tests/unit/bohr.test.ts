import { describe, it, expect } from 'vitest';
import { electronShellGeometry } from '@/lib/bohr';

describe('electronShellGeometry', () => {
  it('returns one shell for hydrogen', () => {
    const shells = electronShellGeometry([1]);
    expect(shells).toHaveLength(1);
    expect(shells[0]?.electrons).toHaveLength(1);
    expect(shells[0]?.label).toBe('K');
  });

  it('seven shells for oganesson', () => {
    const shells = electronShellGeometry([2, 8, 18, 32, 32, 18, 8]);
    expect(shells).toHaveLength(7);
    const total = shells.reduce((a, s) => a + s.electrons.length, 0);
    expect(total).toBe(118);
    expect(shells.map((s) => s.label)).toEqual(['K', 'L', 'M', 'N', 'O', 'P', 'Q']);
  });

  it('shell radii increase monotonically', () => {
    const shells = electronShellGeometry([2, 8, 18, 32, 32, 18, 8]);
    for (let i = 1; i < shells.length; i++) {
      expect(shells[i]!.radius).toBeGreaterThan(shells[i - 1]!.radius);
    }
  });

  it('electron positions are evenly distributed (8 electrons → 45° apart)', () => {
    const shells = electronShellGeometry([8]);
    const electrons = shells[0]!.electrons;
    expect(electrons).toHaveLength(8);
    // Each pair of consecutive electrons should be ~π/4 apart in angle.
    for (let i = 1; i < electrons.length; i++) {
      const prev = electrons[i - 1]!.angle;
      const cur = electrons[i]!.angle;
      const delta = (cur - prev + 2 * Math.PI) % (2 * Math.PI);
      expect(delta).toBeCloseTo(Math.PI / 4, 4);
    }
  });

  it('handles empty outer shell (Pd: [2,8,18,18,0])', () => {
    const shells = electronShellGeometry([2, 8, 18, 18, 0]);
    expect(shells).toHaveLength(5);
    expect(shells[4]?.electrons).toHaveLength(0);
  });

  it('returns empty array for empty input', () => {
    expect(electronShellGeometry([])).toEqual([]);
  });

  it('first electron is positioned at the top of each shell (angle = -π/2)', () => {
    const shells = electronShellGeometry([4, 8]);
    expect(shells[0]?.electrons[0]?.angle).toBeCloseTo(-Math.PI / 2);
    expect(shells[1]?.electrons[0]?.angle).toBeCloseTo(-Math.PI / 2);
  });
});
