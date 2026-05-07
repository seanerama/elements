/**
 * Bohr / electron-shell diagram geometry — pure functions.
 *
 * Given electrons_per_shell, returns concentric-ring layout data
 * suitable for rendering as inline SVG.
 */

export interface ShellGeometry {
  shell: number; // 1-indexed
  label: string; // K, L, M, N, O, P, Q
  radius: number; // px from center
  electrons: Array<{ angle: number; x: number; y: number }>;
}

const SHELL_LABELS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'] as const;

/**
 * Lay out the shell rings inside a viewbox of `size`×`size` (default 320).
 * Reserves a small inner radius for the nucleus.
 */
export function electronShellGeometry(
  electronsPerShell: readonly number[],
  size = 320,
): ShellGeometry[] {
  const cx = size / 2;
  const cy = size / 2;
  const nucleusRadius = 22;
  const outerMargin = 16;

  const totalShells = electronsPerShell.length;
  if (totalShells === 0) return [];

  const innermost = nucleusRadius + 18;
  const outermost = size / 2 - outerMargin;
  const span = outermost - innermost;
  const step = totalShells > 1 ? span / (totalShells - 1) : 0;

  return electronsPerShell.map((count, i) => {
    const radius = totalShells === 1 ? innermost + span * 0.6 : innermost + step * i;
    const electrons: ShellGeometry['electrons'] = [];
    if (count > 0) {
      const baseAngle = -Math.PI / 2; // start at top
      for (let n = 0; n < count; n++) {
        const angle = baseAngle + (n / count) * Math.PI * 2;
        electrons.push({
          angle,
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle),
        });
      }
    }
    return {
      shell: i + 1,
      label: SHELL_LABELS[i] ?? `S${i + 1}`,
      radius,
      electrons,
    };
  });
}
