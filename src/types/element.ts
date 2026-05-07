/**
 * Element schema — single source of truth for per-element data.
 * Mirrors sdd-output/contracts/element-schema.md.
 */

import { z } from 'zod';

export const ElementCategory = z.enum([
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
]);
export type ElementCategory = z.infer<typeof ElementCategory>;

export const PhaseAtSTP = z.enum(['gas', 'liquid', 'solid', 'unknown']);
export type PhaseAtSTP = z.infer<typeof PhaseAtSTP>;

export const ElementBlock = z.enum(['s', 'p', 'd', 'f']);
export type ElementBlock = z.infer<typeof ElementBlock>;

const Compound = z.object({
  formula: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
});

const Discovery = z.object({
  year: z.number().int().nullable(),
  discoverer: z.string().nullable(),
  country: z.string().nullable(),
});

const Occurrence = z.object({
  natural: z.boolean(),
  abundance_summary: z.string(),
  states: z.array(z.string()).default([]),
});

const Citation = z.object({
  field: z.string(),
  source: z.string(),
  url: z.string().url().optional(),
});

export const ElementSchema = z
  .object({
    schema_version: z.literal('1.0.0'),
    atomic_number: z.number().int().min(1).max(118),
    symbol: z.string().min(1).max(3),
    name: z.string().min(1),
    name_origin: z.string().nullable(),
    category: ElementCategory,
    period: z.number().int().min(1).max(7),
    group: z.number().int().min(1).max(18).nullable(),
    block: ElementBlock,
    atomic_mass: z.number().positive(),
    atomic_mass_uncertain: z.boolean().default(false),
    electron_configuration: z.string().min(1),
    electron_configuration_short: z.string().min(1),
    electrons_per_shell: z.array(z.number().int().nonnegative()).min(1).max(7),
    phase_at_stp: PhaseAtSTP,
    density_g_per_cm3: z.number().positive().nullable(),
    melting_point_k: z.number().positive().nullable(),
    boiling_point_k: z.number().positive().nullable(),
    electronegativity_pauling: z.number().nullable(),
    oxidation_states: z.array(z.number().int()),
    discovery: Discovery,
    occurrence: Occurrence,
    compounds: z.array(Compound).default([]),
    uses: z.array(z.string()).default([]),
    reactivity_summary: z.string(),
    isotopes_summary: z.string(),
    image_primary: z.string().nullable(),
    image_alt: z.string().nullable(),
    citations: z.array(Citation).default([]),
  })
  .strict()
  .superRefine((el, ctx) => {
    const sum = el.electrons_per_shell.reduce((a, b) => a + b, 0);
    if (sum !== el.atomic_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `electrons_per_shell sum (${sum}) must equal atomic_number (${el.atomic_number})`,
        path: ['electrons_per_shell'],
      });
    }
  });

export type Element = z.infer<typeof ElementSchema>;
