/**
 * Pipeline orchestrator — fetch element data, source images, build trivia.
 *
 * Manual / dev only. Each sub-step has its own ALLOW_DATA_BUILD guard.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... \
 *   WIKIMEDIA_USER_AGENT='Elements/0.1.0 (...; you@example.com)' \
 *   ALLOW_DATA_BUILD=1 \
 *   npx tsx pipelines/run-all.ts
 */

import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function step(label: string, script: string): void {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync('npx', ['tsx', resolve(__dirname, script)], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`step failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

step('1/3 fetch element data', 'fetch-element-data.ts');
step('2/3 source images', 'source-images.ts');
step('3/3 build trivia bank', 'build-trivia.ts');

console.log('\n✓ pipeline complete');
