import type { Element } from '@/types/element';

export const CATEGORY_LABELS: Record<Element['category'], string> = {
  'alkali-metal': 'Alkali metal',
  'alkaline-earth': 'Alkaline earth metal',
  'transition-metal': 'Transition metal',
  'post-transition': 'Post-transition metal',
  metalloid: 'Metalloid',
  nonmetal: 'Reactive nonmetal',
  halogen: 'Halogen',
  'noble-gas': 'Noble gas',
  lanthanide: 'Lanthanide',
  actinide: 'Actinide',
  unknown: 'Unknown / predicted',
};

/** Order shown in the legend, top-to-bottom. */
export const CATEGORY_ORDER: Array<Element['category']> = [
  'alkali-metal',
  'alkaline-earth',
  'transition-metal',
  'post-transition',
  'metalloid',
  'nonmetal',
  'halogen',
  'noble-gas',
  'lanthanide',
  'actinide',
  'unknown',
];
