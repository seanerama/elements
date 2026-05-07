/**
 * Seed list — every element's identifying data, sourced from IUPAC.
 *
 * Used by:
 *   - fetch-element-data.ts to know what to research for each element
 *   - build-trivia.ts cross-checks
 *   - tests for invariants (length === 118, unique symbols/numbers)
 */

import type { ElementCategory, ElementBlock } from '@/types/element';

export interface ElementSeed {
  atomic_number: number;
  symbol: string;
  name: string;
  category: ElementCategory;
  period: number;
  group: number | null;
  block: ElementBlock;
}

export const ELEMENT_SEED: readonly ElementSeed[] = [
  { atomic_number: 1, symbol: 'H', name: 'Hydrogen', category: 'nonmetal', period: 1, group: 1, block: 's' },
  { atomic_number: 2, symbol: 'He', name: 'Helium', category: 'noble-gas', period: 1, group: 18, block: 's' },
  { atomic_number: 3, symbol: 'Li', name: 'Lithium', category: 'alkali-metal', period: 2, group: 1, block: 's' },
  { atomic_number: 4, symbol: 'Be', name: 'Beryllium', category: 'alkaline-earth', period: 2, group: 2, block: 's' },
  { atomic_number: 5, symbol: 'B', name: 'Boron', category: 'metalloid', period: 2, group: 13, block: 'p' },
  { atomic_number: 6, symbol: 'C', name: 'Carbon', category: 'nonmetal', period: 2, group: 14, block: 'p' },
  { atomic_number: 7, symbol: 'N', name: 'Nitrogen', category: 'nonmetal', period: 2, group: 15, block: 'p' },
  { atomic_number: 8, symbol: 'O', name: 'Oxygen', category: 'nonmetal', period: 2, group: 16, block: 'p' },
  { atomic_number: 9, symbol: 'F', name: 'Fluorine', category: 'halogen', period: 2, group: 17, block: 'p' },
  { atomic_number: 10, symbol: 'Ne', name: 'Neon', category: 'noble-gas', period: 2, group: 18, block: 'p' },
  { atomic_number: 11, symbol: 'Na', name: 'Sodium', category: 'alkali-metal', period: 3, group: 1, block: 's' },
  { atomic_number: 12, symbol: 'Mg', name: 'Magnesium', category: 'alkaline-earth', period: 3, group: 2, block: 's' },
  { atomic_number: 13, symbol: 'Al', name: 'Aluminium', category: 'post-transition', period: 3, group: 13, block: 'p' },
  { atomic_number: 14, symbol: 'Si', name: 'Silicon', category: 'metalloid', period: 3, group: 14, block: 'p' },
  { atomic_number: 15, symbol: 'P', name: 'Phosphorus', category: 'nonmetal', period: 3, group: 15, block: 'p' },
  { atomic_number: 16, symbol: 'S', name: 'Sulfur', category: 'nonmetal', period: 3, group: 16, block: 'p' },
  { atomic_number: 17, symbol: 'Cl', name: 'Chlorine', category: 'halogen', period: 3, group: 17, block: 'p' },
  { atomic_number: 18, symbol: 'Ar', name: 'Argon', category: 'noble-gas', period: 3, group: 18, block: 'p' },
  { atomic_number: 19, symbol: 'K', name: 'Potassium', category: 'alkali-metal', period: 4, group: 1, block: 's' },
  { atomic_number: 20, symbol: 'Ca', name: 'Calcium', category: 'alkaline-earth', period: 4, group: 2, block: 's' },
  { atomic_number: 21, symbol: 'Sc', name: 'Scandium', category: 'transition-metal', period: 4, group: 3, block: 'd' },
  { atomic_number: 22, symbol: 'Ti', name: 'Titanium', category: 'transition-metal', period: 4, group: 4, block: 'd' },
  { atomic_number: 23, symbol: 'V', name: 'Vanadium', category: 'transition-metal', period: 4, group: 5, block: 'd' },
  { atomic_number: 24, symbol: 'Cr', name: 'Chromium', category: 'transition-metal', period: 4, group: 6, block: 'd' },
  { atomic_number: 25, symbol: 'Mn', name: 'Manganese', category: 'transition-metal', period: 4, group: 7, block: 'd' },
  { atomic_number: 26, symbol: 'Fe', name: 'Iron', category: 'transition-metal', period: 4, group: 8, block: 'd' },
  { atomic_number: 27, symbol: 'Co', name: 'Cobalt', category: 'transition-metal', period: 4, group: 9, block: 'd' },
  { atomic_number: 28, symbol: 'Ni', name: 'Nickel', category: 'transition-metal', period: 4, group: 10, block: 'd' },
  { atomic_number: 29, symbol: 'Cu', name: 'Copper', category: 'transition-metal', period: 4, group: 11, block: 'd' },
  { atomic_number: 30, symbol: 'Zn', name: 'Zinc', category: 'transition-metal', period: 4, group: 12, block: 'd' },
  { atomic_number: 31, symbol: 'Ga', name: 'Gallium', category: 'post-transition', period: 4, group: 13, block: 'p' },
  { atomic_number: 32, symbol: 'Ge', name: 'Germanium', category: 'metalloid', period: 4, group: 14, block: 'p' },
  { atomic_number: 33, symbol: 'As', name: 'Arsenic', category: 'metalloid', period: 4, group: 15, block: 'p' },
  { atomic_number: 34, symbol: 'Se', name: 'Selenium', category: 'nonmetal', period: 4, group: 16, block: 'p' },
  { atomic_number: 35, symbol: 'Br', name: 'Bromine', category: 'halogen', period: 4, group: 17, block: 'p' },
  { atomic_number: 36, symbol: 'Kr', name: 'Krypton', category: 'noble-gas', period: 4, group: 18, block: 'p' },
  { atomic_number: 37, symbol: 'Rb', name: 'Rubidium', category: 'alkali-metal', period: 5, group: 1, block: 's' },
  { atomic_number: 38, symbol: 'Sr', name: 'Strontium', category: 'alkaline-earth', period: 5, group: 2, block: 's' },
  { atomic_number: 39, symbol: 'Y', name: 'Yttrium', category: 'transition-metal', period: 5, group: 3, block: 'd' },
  { atomic_number: 40, symbol: 'Zr', name: 'Zirconium', category: 'transition-metal', period: 5, group: 4, block: 'd' },
  { atomic_number: 41, symbol: 'Nb', name: 'Niobium', category: 'transition-metal', period: 5, group: 5, block: 'd' },
  { atomic_number: 42, symbol: 'Mo', name: 'Molybdenum', category: 'transition-metal', period: 5, group: 6, block: 'd' },
  { atomic_number: 43, symbol: 'Tc', name: 'Technetium', category: 'transition-metal', period: 5, group: 7, block: 'd' },
  { atomic_number: 44, symbol: 'Ru', name: 'Ruthenium', category: 'transition-metal', period: 5, group: 8, block: 'd' },
  { atomic_number: 45, symbol: 'Rh', name: 'Rhodium', category: 'transition-metal', period: 5, group: 9, block: 'd' },
  { atomic_number: 46, symbol: 'Pd', name: 'Palladium', category: 'transition-metal', period: 5, group: 10, block: 'd' },
  { atomic_number: 47, symbol: 'Ag', name: 'Silver', category: 'transition-metal', period: 5, group: 11, block: 'd' },
  { atomic_number: 48, symbol: 'Cd', name: 'Cadmium', category: 'transition-metal', period: 5, group: 12, block: 'd' },
  { atomic_number: 49, symbol: 'In', name: 'Indium', category: 'post-transition', period: 5, group: 13, block: 'p' },
  { atomic_number: 50, symbol: 'Sn', name: 'Tin', category: 'post-transition', period: 5, group: 14, block: 'p' },
  { atomic_number: 51, symbol: 'Sb', name: 'Antimony', category: 'metalloid', period: 5, group: 15, block: 'p' },
  { atomic_number: 52, symbol: 'Te', name: 'Tellurium', category: 'metalloid', period: 5, group: 16, block: 'p' },
  { atomic_number: 53, symbol: 'I', name: 'Iodine', category: 'halogen', period: 5, group: 17, block: 'p' },
  { atomic_number: 54, symbol: 'Xe', name: 'Xenon', category: 'noble-gas', period: 5, group: 18, block: 'p' },
  { atomic_number: 55, symbol: 'Cs', name: 'Caesium', category: 'alkali-metal', period: 6, group: 1, block: 's' },
  { atomic_number: 56, symbol: 'Ba', name: 'Barium', category: 'alkaline-earth', period: 6, group: 2, block: 's' },
  { atomic_number: 57, symbol: 'La', name: 'Lanthanum', category: 'lanthanide', period: 6, group: 3, block: 'd' },
  { atomic_number: 58, symbol: 'Ce', name: 'Cerium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 59, symbol: 'Pr', name: 'Praseodymium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 60, symbol: 'Nd', name: 'Neodymium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 61, symbol: 'Pm', name: 'Promethium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 62, symbol: 'Sm', name: 'Samarium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 63, symbol: 'Eu', name: 'Europium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 64, symbol: 'Gd', name: 'Gadolinium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 65, symbol: 'Tb', name: 'Terbium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 66, symbol: 'Dy', name: 'Dysprosium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 67, symbol: 'Ho', name: 'Holmium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 68, symbol: 'Er', name: 'Erbium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 69, symbol: 'Tm', name: 'Thulium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 70, symbol: 'Yb', name: 'Ytterbium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 71, symbol: 'Lu', name: 'Lutetium', category: 'lanthanide', period: 6, group: null, block: 'f' },
  { atomic_number: 72, symbol: 'Hf', name: 'Hafnium', category: 'transition-metal', period: 6, group: 4, block: 'd' },
  { atomic_number: 73, symbol: 'Ta', name: 'Tantalum', category: 'transition-metal', period: 6, group: 5, block: 'd' },
  { atomic_number: 74, symbol: 'W', name: 'Tungsten', category: 'transition-metal', period: 6, group: 6, block: 'd' },
  { atomic_number: 75, symbol: 'Re', name: 'Rhenium', category: 'transition-metal', period: 6, group: 7, block: 'd' },
  { atomic_number: 76, symbol: 'Os', name: 'Osmium', category: 'transition-metal', period: 6, group: 8, block: 'd' },
  { atomic_number: 77, symbol: 'Ir', name: 'Iridium', category: 'transition-metal', period: 6, group: 9, block: 'd' },
  { atomic_number: 78, symbol: 'Pt', name: 'Platinum', category: 'transition-metal', period: 6, group: 10, block: 'd' },
  { atomic_number: 79, symbol: 'Au', name: 'Gold', category: 'transition-metal', period: 6, group: 11, block: 'd' },
  { atomic_number: 80, symbol: 'Hg', name: 'Mercury', category: 'transition-metal', period: 6, group: 12, block: 'd' },
  { atomic_number: 81, symbol: 'Tl', name: 'Thallium', category: 'post-transition', period: 6, group: 13, block: 'p' },
  { atomic_number: 82, symbol: 'Pb', name: 'Lead', category: 'post-transition', period: 6, group: 14, block: 'p' },
  { atomic_number: 83, symbol: 'Bi', name: 'Bismuth', category: 'post-transition', period: 6, group: 15, block: 'p' },
  { atomic_number: 84, symbol: 'Po', name: 'Polonium', category: 'post-transition', period: 6, group: 16, block: 'p' },
  { atomic_number: 85, symbol: 'At', name: 'Astatine', category: 'halogen', period: 6, group: 17, block: 'p' },
  { atomic_number: 86, symbol: 'Rn', name: 'Radon', category: 'noble-gas', period: 6, group: 18, block: 'p' },
  { atomic_number: 87, symbol: 'Fr', name: 'Francium', category: 'alkali-metal', period: 7, group: 1, block: 's' },
  { atomic_number: 88, symbol: 'Ra', name: 'Radium', category: 'alkaline-earth', period: 7, group: 2, block: 's' },
  { atomic_number: 89, symbol: 'Ac', name: 'Actinium', category: 'actinide', period: 7, group: 3, block: 'd' },
  { atomic_number: 90, symbol: 'Th', name: 'Thorium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 91, symbol: 'Pa', name: 'Protactinium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 92, symbol: 'U', name: 'Uranium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 93, symbol: 'Np', name: 'Neptunium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 94, symbol: 'Pu', name: 'Plutonium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 95, symbol: 'Am', name: 'Americium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 96, symbol: 'Cm', name: 'Curium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 97, symbol: 'Bk', name: 'Berkelium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 98, symbol: 'Cf', name: 'Californium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 99, symbol: 'Es', name: 'Einsteinium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 100, symbol: 'Fm', name: 'Fermium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 101, symbol: 'Md', name: 'Mendelevium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 102, symbol: 'No', name: 'Nobelium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 103, symbol: 'Lr', name: 'Lawrencium', category: 'actinide', period: 7, group: null, block: 'f' },
  { atomic_number: 104, symbol: 'Rf', name: 'Rutherfordium', category: 'transition-metal', period: 7, group: 4, block: 'd' },
  { atomic_number: 105, symbol: 'Db', name: 'Dubnium', category: 'transition-metal', period: 7, group: 5, block: 'd' },
  { atomic_number: 106, symbol: 'Sg', name: 'Seaborgium', category: 'transition-metal', period: 7, group: 6, block: 'd' },
  { atomic_number: 107, symbol: 'Bh', name: 'Bohrium', category: 'transition-metal', period: 7, group: 7, block: 'd' },
  { atomic_number: 108, symbol: 'Hs', name: 'Hassium', category: 'transition-metal', period: 7, group: 8, block: 'd' },
  { atomic_number: 109, symbol: 'Mt', name: 'Meitnerium', category: 'unknown', period: 7, group: 9, block: 'd' },
  { atomic_number: 110, symbol: 'Ds', name: 'Darmstadtium', category: 'unknown', period: 7, group: 10, block: 'd' },
  { atomic_number: 111, symbol: 'Rg', name: 'Roentgenium', category: 'unknown', period: 7, group: 11, block: 'd' },
  { atomic_number: 112, symbol: 'Cn', name: 'Copernicium', category: 'unknown', period: 7, group: 12, block: 'd' },
  { atomic_number: 113, symbol: 'Nh', name: 'Nihonium', category: 'unknown', period: 7, group: 13, block: 'p' },
  { atomic_number: 114, symbol: 'Fl', name: 'Flerovium', category: 'unknown', period: 7, group: 14, block: 'p' },
  { atomic_number: 115, symbol: 'Mc', name: 'Moscovium', category: 'unknown', period: 7, group: 15, block: 'p' },
  { atomic_number: 116, symbol: 'Lv', name: 'Livermorium', category: 'unknown', period: 7, group: 16, block: 'p' },
  { atomic_number: 117, symbol: 'Ts', name: 'Tennessine', category: 'unknown', period: 7, group: 17, block: 'p' },
  { atomic_number: 118, symbol: 'Og', name: 'Oganesson', category: 'unknown', period: 7, group: 18, block: 'p' },
] as const;

/** Lookup helpers */
export const SYMBOL_TO_SEED: Record<string, ElementSeed> = Object.fromEntries(
  ELEMENT_SEED.map((e) => [e.symbol, e]),
);

export const SYMBOL_TO_LOWER: Record<string, string> = Object.fromEntries(
  ELEMENT_SEED.map((e) => [e.symbol, e.symbol.toLowerCase()]),
);
