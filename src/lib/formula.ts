/**
 * Subscript chemistry formulas at render time.
 *
 * Examples:
 *   "H2O"     → [{ text: 'H', sub: false }, { text: '2', sub: true }, { text: 'O', sub: false }]
 *   "Fe2O3"   → Fe + 2 + O + 3
 *   "Na2SO4"  → Na + 2 + S + O + 4
 *   "HCO3-"   → H + C + O + 3 + - (the trailing charge stays inline)
 *
 * Pure regex split — does not parse polyatomic groupings or multipliers.
 */

export interface FormulaPart {
  text: string;
  sub: boolean;
}

const TOKEN_RE = /([A-Z][a-z]?)(\d+)?/g;

export function splitFormula(formula: string): FormulaPart[] {
  const parts: FormulaPart[] = [];
  let lastIndex = 0;

  // Capture each element-token plus its optional digit count.
  for (const match of formula.matchAll(TOKEN_RE)) {
    if (match.index! > lastIndex) {
      // Non-element segment (e.g. parens, charges, dashes)
      parts.push({ text: formula.slice(lastIndex, match.index), sub: false });
    }
    parts.push({ text: match[1]!, sub: false });
    if (match[2]) {
      parts.push({ text: match[2], sub: true });
    }
    lastIndex = (match.index ?? 0) + match[0].length;
  }

  if (lastIndex < formula.length) {
    parts.push({ text: formula.slice(lastIndex), sub: false });
  }

  return parts;
}
