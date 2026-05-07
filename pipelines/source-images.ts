/**
 * Image sourcing pipeline.
 *
 * For each element with no committed image:
 *   1. Query Wikimedia Commons for a license-acceptable photo.
 *   2. If none found, invoke nano-banana for a generated image.
 *   3. Write the binary to data/elements/<symbol>/images/sample.<ext> + a
 *      sibling sample.license.json sidecar.
 *
 * Manual / dev only. Never runs in CI.
 *
 * Usage:
 *   WIKIMEDIA_USER_AGENT='Elements/0.1.0 (https://elements.seanmahoney.ai; you@example.com)' \
 *   ALLOW_DATA_BUILD=1 \
 *   npx tsx pipelines/source-images.ts
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENT_SEED, type ElementSeed } from './element-seed';
import type { ImageLicenseRecord } from '@/types/image-license';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'data', 'elements');

const ALLOWED_LICENSES = new Set([
  'Creative Commons Attribution 4.0',
  'Creative Commons Attribution-ShareAlike 4.0',
  'Creative Commons Attribution 3.0',
  'Creative Commons Attribution-ShareAlike 3.0',
  'Creative Commons Zero',
  'Public domain',
]);

const LICENSE_MAP: Record<string, ImageLicenseRecord['license']> = {
  'Creative Commons Attribution 4.0': 'CC-BY-4.0',
  'Creative Commons Attribution-ShareAlike 4.0': 'CC-BY-SA-4.0',
  'Creative Commons Attribution 3.0': 'CC-BY-3.0',
  'Creative Commons Attribution-ShareAlike 3.0': 'CC-BY-SA-3.0',
  'Creative Commons Zero': 'CC0',
  'Public domain': 'PUBLIC-DOMAIN',
};

function imageDirFor(seed: ElementSeed): string {
  return join(DATA_DIR, seed.symbol.toLowerCase(), 'images');
}

async function searchWikimedia(
  query: string,
  ua: string,
): Promise<{
  url: string;
  pageUrl: string;
  license: string;
  attribution: string;
} | null> {
  // Search for files
  const search = new URL('https://commons.wikimedia.org/w/api.php');
  search.searchParams.set('action', 'query');
  search.searchParams.set('format', 'json');
  search.searchParams.set('generator', 'search');
  search.searchParams.set('gsrsearch', `${query} filetype:bitmap`);
  search.searchParams.set('gsrnamespace', '6');
  search.searchParams.set('gsrlimit', '5');
  search.searchParams.set('prop', 'imageinfo');
  search.searchParams.set('iiprop', 'url|extmetadata');
  search.searchParams.set('iiurlwidth', '1280');

  const res = await fetch(search.toString(), { headers: { 'User-Agent': ua } });
  if (!res.ok) return null;

  const data: any = await res.json();
  const pages = data.query?.pages ?? {};
  for (const page of Object.values(pages)) {
    const ii = (page as any).imageinfo?.[0];
    if (!ii) continue;
    const meta = ii.extmetadata ?? {};
    const license = meta.LicenseShortName?.value ?? meta.UsageTerms?.value ?? '';
    const licenseFull = meta.UsageTerms?.value ?? license;
    if (!ALLOWED_LICENSES.has(licenseFull) && !ALLOWED_LICENSES.has(license)) continue;
    return {
      url: ii.thumburl ?? ii.url,

      pageUrl: (page as any).canonicalurl ?? (page as any).fullurl ?? '',
      license: ALLOWED_LICENSES.has(licenseFull) ? licenseFull : license,
      attribution: meta.Artist?.value?.replace(/<[^>]+>/g, '') ?? 'Wikimedia Commons',
    };
  }
  return null;
}

async function downloadTo(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
}

async function processElement(seed: ElementSeed, ua: string): Promise<string> {
  const dir = imageDirFor(seed);
  const samplePath = join(dir, 'sample.jpg');
  const licensePath = join(dir, 'sample.license.json');

  if (existsSync(samplePath) && existsSync(licensePath)) return 'exists';

  const wm = await searchWikimedia(`${seed.name} element`, ua);
  if (wm) {
    mkdirSync(dir, { recursive: true });
    await downloadTo(wm.url, samplePath);
    const license: ImageLicenseRecord = {
      source: 'wikimedia',
      license: LICENSE_MAP[wm.license] ?? 'PUBLIC-DOMAIN',
      attribution: `${wm.attribution} (${wm.license}) — Wikimedia Commons`,
      source_url: wm.pageUrl || null,
      fetched_at: new Date().toISOString(),
    };
    writeFileSync(licensePath, JSON.stringify(license, null, 2) + '\n');
    return 'wikimedia';
  }

  // Wikimedia missed — caller should now invoke `nano-banana` skill for this seed
  // (this script is run from a Claude Code session where the skill is available).
  return 'NEEDS_GENERATION';
}

async function main(): Promise<void> {
  if (!process.env.ALLOW_DATA_BUILD) {
    console.error('refusing to run: set ALLOW_DATA_BUILD=1');
    process.exit(2);
  }
  const ua = process.env.WIKIMEDIA_USER_AGENT;
  if (!ua) {
    console.error('WIKIMEDIA_USER_AGENT required (per Wikimedia API policy)');
    process.exit(2);
  }

  const needsGen: string[] = [];
  for (const seed of ELEMENT_SEED) {
    process.stdout.write(`  ${seed.symbol.padEnd(3)} ${seed.name.padEnd(16)} `);
    try {
      const result = await processElement(seed, ua);
      console.log(result);
      if (result === 'NEEDS_GENERATION') needsGen.push(seed.symbol);
    } catch (e) {
      console.log(`FAIL: ${e instanceof Error ? e.message : String(e)}`);
      needsGen.push(seed.symbol);
    }
  }

  if (needsGen.length > 0) {
    console.log(
      `\n${needsGen.length} element(s) need nano-banana generation: ${needsGen.join(', ')}`,
    );
    console.log('Re-run from a Claude Code session and use the nano-banana skill.');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
