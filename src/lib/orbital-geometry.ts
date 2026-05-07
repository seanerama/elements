/**
 * Pure-function scene config for the 3D orbital visualization.
 * Given electrons_per_shell, returns shell radii, electron orbital speeds,
 * and a per-electron offset around its shell.
 *
 * No Three.js types here — keeps this file testable without DOM/WebGL.
 */

export interface OrbitalShell {
  index: number; // 1-indexed
  radius: number; // scene units
  speed: number; // radians per second
  electrons: Array<{
    /** initial phase offset (radians) around the shell circle */
    phase: number;
    /** which axis the orbit tilts around — varied per electron for visual interest */
    tiltAxis: [number, number, number];
    /** tilt angle (radians) */
    tiltAngle: number;
  }>;
}

export interface OrbitalScene {
  shells: OrbitalShell[];
  totalElectrons: number;
  nucleusRadius: number;
}

const NUCLEUS_RADIUS = 0.3;
const FIRST_SHELL_RADIUS = 1.0;
const SHELL_STEP = 0.6;
const BASE_SPEED = 0.6;

export function orbitalsForShells(
  electronsPerShell: readonly number[],
  reducedMotion = false,
): OrbitalScene {
  const shells: OrbitalShell[] = electronsPerShell.map((count, i) => {
    const radius = FIRST_SHELL_RADIUS + i * SHELL_STEP;
    // Outer shells rotate slower so they don't blur into a smear.
    const speed = reducedMotion ? 0 : BASE_SPEED / Math.sqrt(i + 1);
    const electrons = Array.from({ length: count }, (_, n) => {
      const phase = (n / Math.max(count, 1)) * Math.PI * 2;
      // Vary tilt axis: alternate so consecutive shells aren't coplanar.
      const tiltAxis: [number, number, number] =
        i % 3 === 0 ? [0, 1, 0] : i % 3 === 1 ? [1, 0, 0] : [1, 1, 0];
      const tiltAngle = (i * 0.18 + n * 0.01) % (Math.PI / 4);
      return { phase, tiltAxis, tiltAngle };
    });
    return { index: i + 1, radius, speed, electrons };
  });

  const totalElectrons = electronsPerShell.reduce((a, b) => a + b, 0);
  return { shells, totalElectrons, nucleusRadius: NUCLEUS_RADIUS };
}
