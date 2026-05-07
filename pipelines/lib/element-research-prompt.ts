/**
 * The single canonical prompt used by sub-agents to research each element.
 *
 * Re-running the pipeline must produce schema-valid JSON. Keep this prompt
 * deterministic in shape — never let downstream consumers see free-form text.
 */

import type { ElementSeed } from '../element-seed';

export function buildResearchPrompt(seed: ElementSeed): string {
  return `You are a chemistry research agent. Produce a single JSON object describing element ${seed.symbol} (${seed.name}, atomic number ${seed.atomic_number}).

The JSON MUST conform exactly to this shape (no extra fields, no missing fields):

{
  "schema_version": "1.0.0",
  "atomic_number": ${seed.atomic_number},
  "symbol": "${seed.symbol}",
  "name": "${seed.name}",
  "name_origin": <string | null>,                       // brief etymology
  "category": "${seed.category}",
  "period": ${seed.period},
  "group": ${seed.group === null ? 'null' : seed.group},
  "block": "${seed.block}",
  "atomic_mass": <number>,                              // standard atomic weight (or most stable isotope mass)
  "atomic_mass_uncertain": <boolean>,                   // true for synthetic/short-lived
  "electron_configuration": <string>,                   // full, e.g. "1s2 2s2 2p6 ..."
  "electron_configuration_short": <string>,             // noble-gas shorthand, e.g. "[Ne] 3s1"
  "electrons_per_shell": <number[]>,                    // SUM MUST EQUAL ${seed.atomic_number}
  "phase_at_stp": "gas" | "liquid" | "solid" | "unknown",
  "density_g_per_cm3": <number | null>,
  "melting_point_k": <number | null>,
  "boiling_point_k": <number | null>,
  "electronegativity_pauling": <number | null>,
  "oxidation_states": <number[]>,                       // common only
  "discovery": {
    "year": <number | null>,
    "discoverer": <string | null>,
    "country": <string | null>
  },
  "occurrence": {
    "natural": <boolean>,
    "abundance_summary": <string>,                       // 1–2 sentences
    "states": <string[]>                                  // e.g. ["gas", "elemental in stars"]
  },
  "compounds": [
    { "formula": <string>, "name": <string>, "summary": <string> }
  ],
  "uses": <string[]>,                                    // 3–6 bullet-style strings
  "reactivity_summary": <string>,                        // 1–3 sentences
  "isotopes_summary": <string>,                          // 1–2 sentences
  "image_primary": null,
  "image_alt": null,
  "citations": [
    { "field": <string>, "source": <string>, "url": <string?> }
  ]
}

REQUIREMENTS:
- The electrons_per_shell array MUST sum to ${seed.atomic_number}.
- Use accurate, current chemistry references (CRC Handbook, IUPAC, RSC, Wikipedia infobox values cross-checked).
- For synthetic / superheavy elements, mark unknown values as null and atomic_mass_uncertain=true.
- Provide at least 3 citations, ideally tied to the most-uncertain numeric fields.
- Output ONLY the JSON. No prose, no markdown fence.`;
}
