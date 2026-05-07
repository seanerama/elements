/**
 * Element data orchestrator — drives sub-agents for each element in the seed list,
 * validates results against ElementSchema, and writes data/elements/<symbol>/data.json.
 *
 * Manual / dev only. Never runs in CI (guarded by ALLOW_DATA_BUILD env var).
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... ALLOW_DATA_BUILD=1 npx tsx pipelines/fetch-element-data.ts
 *   ANTHROPIC_API_KEY=sk-... ALLOW_DATA_BUILD=1 npx tsx pipelines/fetch-element-data.ts --only=h,fe,au
 *   ALLOW_DATA_BUILD=1 npx tsx pipelines/fetch-element-data.ts --validate-only
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENT_SEED, type ElementSeed } from './element-seed';
import { ElementSchema } from '@/types/element';
import { buildResearchPrompt } from './lib/element-research-prompt';
import { runElementSubAgent } from './lib/sub-agent';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'data', 'elements');

function parseArgs(): { only?: Set<string>; validateOnly: boolean } {
  const argv = process.argv.slice(2);
  let only: Set<string> | undefined;
  let validateOnly = false;
  for (const a of argv) {
    if (a.startsWith('--only=')) {
      only = new Set(
        a.slice('--only='.length).split(',').map((s) => s.trim().toLowerCase()),
      );
    }
    if (a === '--validate-only') {
      validateOnly = true;
    }
  }
  return { only, validateOnly };
}

function shouldProcess(seed: ElementSeed, only?: Set<string>): boolean {
  if (!only) return true;
  return only.has(seed.symbol.toLowerCase());
}

function dataPathFor(seed: ElementSeed): string {
  return join(DATA_DIR, seed.symbol.toLowerCase(), 'data.json');
}

async function processElement(
  seed: ElementSeed,
  validateOnly: boolean,
): Promise<{ ok: boolean; reason?: string }> {
  const path = dataPathFor(seed);

  if (validateOnly) {
    if (!existsSync(path)) return { ok: false, reason: 'no data.json' };
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf-8'));
      const result = ElementSchema.safeParse(parsed);
      if (!result.success) {
        return {
          ok: false,
          reason: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : String(e) };
    }
  }

  if (existsSync(path)) {
    return { ok: true, reason: 'already exists, skipping' };
  }

  const prompt = buildResearchPrompt(seed);
  const result = await runElementSubAgent({ prompt });
  if (!result.success || !result.data) {
    return { ok: false, reason: result.error };
  }

  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(result.data, null, 2) + '\n');
  return { ok: true };
}

async function main(): Promise<void> {
  const { only, validateOnly } = parseArgs();

  if (!validateOnly && !process.env.ALLOW_DATA_BUILD) {
    console.error('refusing to run: set ALLOW_DATA_BUILD=1 to enable element fetch');
    process.exit(2);
  }

  const targets = ELEMENT_SEED.filter((s) => shouldProcess(s, only));
  console.log(`processing ${targets.length} element(s)${validateOnly ? ' (validate-only)' : ''}`);

  const failures: Array<{ symbol: string; reason: string }> = [];
  for (const seed of targets) {
    process.stdout.write(`  ${seed.symbol.padEnd(3)} ${seed.name.padEnd(16)} `);
    const res = await processElement(seed, validateOnly);
    if (res.ok) {
      console.log(res.reason ?? 'ok');
    } else {
      console.log(`FAIL: ${res.reason}`);
      failures.push({ symbol: seed.symbol, reason: res.reason ?? 'unknown' });
    }
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} failure(s):`);
    for (const f of failures) console.error(`  ${f.symbol}: ${f.reason}`);
    process.exit(1);
  }

  console.log(`\n✓ all ${targets.length} element(s) processed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
