/**
 * Keyboard navigation across the periodic table grid.
 *
 * Pure utility: given the current element and a key, returns the next element
 * to focus. Handles the lanthanide/actinide split (those rows are physically
 * disconnected from the main grid).
 *
 * Layout coordinates:
 *   - Main grid: rows 1..7, columns 1..18
 *   - Lanthanide row: row 8, columns 4..17  (Ce..Lu = atomic 58..71)
 *   - Actinide row:  row 9, columns 4..17  (Th..Lr = atomic 90..103)
 */

export interface GridSlot {
  symbol: string;
  atomic_number: number;
  row: number; // 1..9 (main + 2 inner rows)
  col: number; // 1..18
}

export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

/**
 * IUPAC-style placement for all 118 elements.
 * La (57) and Ac (89) sit in column 3 of the main grid.
 * Inner rows for Ce-Lu (row 8) and Th-Lr (row 9).
 */
export function buildGrid(
  seeds: Array<{ atomic_number: number; symbol: string; period: number; group: number | null }>,
): GridSlot[] {
  const slots: GridSlot[] = [];
  for (const s of seeds) {
    let row = s.period;
    let col: number | null = null;

    if (s.atomic_number >= 58 && s.atomic_number <= 71) {
      // Lanthanide inner row
      row = 8;
      col = s.atomic_number - 58 + 4; // 58→4, 71→17
    } else if (s.atomic_number >= 90 && s.atomic_number <= 103) {
      row = 9;
      col = s.atomic_number - 90 + 4;
    } else if (s.group !== null) {
      col = s.group;
    }

    if (col !== null) {
      slots.push({ symbol: s.symbol, atomic_number: s.atomic_number, row, col });
    }
  }
  return slots;
}

/** Returns the element to focus next, or null if no movement is possible. */
export function nextSlot(current: GridSlot, key: ArrowKey, grid: GridSlot[]): GridSlot | null {
  const byPos = new Map<string, GridSlot>();
  for (const s of grid) byPos.set(`${s.row}:${s.col}`, s);

  const dir = {
    ArrowUp: { dr: -1, dc: 0 },
    ArrowDown: { dr: 1, dc: 0 },
    ArrowLeft: { dr: 0, dc: -1 },
    ArrowRight: { dr: 0, dc: 1 },
  }[key];

  let r = current.row;
  let c = current.col;
  // Walk in the chosen direction; skip empty grid cells until we hit something.
  for (let step = 0; step < 20; step++) {
    r += dir.dr;
    c += dir.dc;
    if (r < 1 || r > 9 || c < 1 || c > 18) return null;
    const hit = byPos.get(`${r}:${c}`);
    if (hit) return hit;
  }
  return null;
}
