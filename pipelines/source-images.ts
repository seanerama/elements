/**
 * Image sourcing pipeline.
 *
 * Strategy:
 *   1. Hit Wikipedia's REST summary API for each element by name (more reliable
 *      than Commons file search — element pages have a curated infobox image).
 *   2. License-check via Commons API (only CC-BY/CC-BY-SA/CC0/PD accepted).
 *   3. Download with rate-limiting (1.5s between calls) and 429 retry.
 *   4. Write data/elements/<symbol>/images/sample.jpg + sample.license.json.
 *   5. Update data.json's image_primary + image_alt.
 *   6. For elements where Wikimedia has nothing acceptable, log NEEDS_GENERATION
 *      so a Claude Code session can fall back to the nano-banana skill.
 *
 * Manual / dev only. Never runs in CI.
 *
 * Usage:
 *   WIKIMEDIA_USER_AGENT='Elements/0.1.0 (https://elements.seanmahoney.ai; you@example.com)' \
 *   ALLOW_DATA_BUILD=1 \
 *   npx tsx pipelines/source-images.ts
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENT_SEED, type ElementSeed } from './element-seed';
import { ElementSchema, type Element } from '@/types/element';
import type { ImageLicenseRecord, ImageLicense } from '@/types/image-license';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DATA_DIR = join(REPO_ROOT, 'data', 'elements');

const REQUEST_DELAY_MS = 1500;
const MAX_RETRIES = 3;

const LICENSE_MAP: Record<string, ImageLicense> = {
  cc0: 'CC0',
  pd: 'PUBLIC-DOMAIN',
  'public domain': 'PUBLIC-DOMAIN',
  'cc by 4.0': 'CC-BY-4.0',
  'cc-by-4.0': 'CC-BY-4.0',
  'creative commons attribution 4.0': 'CC-BY-4.0',
  'cc by-sa 4.0': 'CC-BY-SA-4.0',
  'cc-by-sa-4.0': 'CC-BY-SA-4.0',
  'creative commons attribution-sharealike 4.0': 'CC-BY-SA-4.0',
  'cc by 3.0': 'CC-BY-3.0',
  'cc-by-3.0': 'CC-BY-3.0',
  'creative commons attribution 3.0': 'CC-BY-3.0',
  'cc by-sa 3.0': 'CC-BY-SA-3.0',
  'cc-by-sa-3.0': 'CC-BY-SA-3.0',
  'creative commons attribution-sharealike 3.0': 'CC-BY-SA-3.0',
};

function normalizeLicense(raw: string | undefined): ImageLicense | null {
  if (!raw) return null;
  const key = raw.toLowerCase().trim();
  if (LICENSE_MAP[key]) return LICENSE_MAP[key];
  // Pattern matches like "CC BY-SA 4.0" with extra text
  for (const [k, v] of Object.entries(LICENSE_MAP)) {
    if (key.includes(k)) return v;
  }
  if (key.includes('public domain')) return 'PUBLIC-DOMAIN';
  return null;
}

function imageDirFor(seed: ElementSeed): string {
  return join(DATA_DIR, seed.symbol.toLowerCase(), 'images');
}

function dataPathFor(seed: ElementSeed): string {
  return join(DATA_DIR, seed.symbol.toLowerCase(), 'data.json');
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

interface WikipediaSummary {
  imageTitle: string | null;
  imageUrl: string | null;
  pageUrl: string | null;
  extract: string;
}

async function fetchSummary(name: string, ua: string): Promise<WikipediaSummary | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/json' } });
    if (res.status === 429) {
      const wait = (attempt + 1) * 5000;
      console.log(`  [rate-limited, waiting ${wait}ms]`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) return null;
    const j = (await res.json()) as {
      originalimage?: { source: string };
      thumbnail?: { source: string };
      content_urls?: { desktop?: { page?: string } };
      extract?: string;
    };
    return {
      imageTitle: null,
      imageUrl: j.originalimage?.source ?? j.thumbnail?.source ?? null,
      pageUrl: j.content_urls?.desktop?.page ?? null,
      extract: j.extract ?? '',
    };
  }
  return null;
}

interface CommonsLicense {
  license: ImageLicense;
  attribution: string;
  pageUrl: string | null;
}

async function fetchCommonsLicense(
  imageUrl: string,
  ua: string,
): Promise<CommonsLicense | null> {
  // Image URL looks like: https://upload.wikimedia.org/wikipedia/commons/thumb/X/Y/Filename.jpg/640px-Filename.jpg
  // Or:                   https://upload.wikimedia.org/wikipedia/commons/X/Y/Filename.jpg
  const match = imageUrl.match(/\/wikipedia\/commons(?:\/thumb)?\/[a-f0-9]\/[a-f0-9]{2}\/([^/?]+)/);
  if (!match) return null;
  const filename = decodeURIComponent(match[1]!);

  const apiUrl = new URL('https://commons.wikimedia.org/w/api.php');
  apiUrl.searchParams.set('action', 'query');
  apiUrl.searchParams.set('format', 'json');
  apiUrl.searchParams.set('titles', `File:${filename}`);
  apiUrl.searchParams.set('prop', 'imageinfo');
  apiUrl.searchParams.set('iiprop', 'extmetadata|url');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(apiUrl.toString(), { headers: { 'User-Agent': ua } });
    if (res.status === 429) {
      await sleep((attempt + 1) * 5000);
      continue;
    }
    if (!res.ok) return null;
    const j = (await res.json()) as { query?: { pages?: Record<string, unknown> } };
    const pages = j.query?.pages ?? {};
    for (const page of Object.values(pages) as Array<{
      imageinfo?: Array<{
        descriptionurl?: string;
        extmetadata?: {
          LicenseShortName?: { value?: string };
          UsageTerms?: { value?: string };
          Artist?: { value?: string };
          LicenseUrl?: { value?: string };
        };
      }>;
    }>) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      const meta = ii.extmetadata ?? {};
      const licenseRaw = meta.LicenseShortName?.value ?? meta.UsageTerms?.value;
      const license = normalizeLicense(licenseRaw);
      if (!license) return null;
      const artistHtml = meta.Artist?.value ?? 'Wikimedia Commons';
      const artist = artistHtml.replace(/<[^>]+>/g, '').trim();
      return {
        license,
        attribution: `${artist} (${licenseRaw}) — Wikimedia Commons`,
        pageUrl: ii.descriptionurl ?? null,
      };
    }
    return null;
  }
  return null;
}

async function downloadTo(url: string, dest: string, ua: string): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': ua } });
    if (res.status === 429) {
      await sleep((attempt + 1) * 5000);
      continue;
    }
    if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    return;
  }
  throw new Error(`download exhausted retries: ${url}`);
}

function loadData(seed: ElementSeed): Element {
  const raw = readFileSync(dataPathFor(seed), 'utf-8');
  return ElementSchema.parse(JSON.parse(raw));
}

function saveData(seed: ElementSeed, el: Element): void {
  writeFileSync(dataPathFor(seed), JSON.stringify(el, null, 2) + '\n');
}

async function processElement(seed: ElementSeed, ua: string): Promise<string> {
  const dir = imageDirFor(seed);
  const samplePath = join(dir, 'sample.jpg');
  const licensePath = join(dir, 'sample.license.json');

  if (existsSync(samplePath) && existsSync(licensePath)) return 'exists';

  // Step 1: pull element page summary
  const summary = await fetchSummary(seed.name, ua);
  if (!summary || !summary.imageUrl) {
    return 'NEEDS_GENERATION';
  }
  // Skip non-Commons images (e.g., en.wikipedia local uploads, often without machine-readable license)
  if (!summary.imageUrl.includes('/wikipedia/commons/')) {
    return 'NEEDS_GENERATION (non-commons image)';
  }
  await sleep(REQUEST_DELAY_MS);

  // Step 2: license check via Commons API
  const license = await fetchCommonsLicense(summary.imageUrl, ua);
  if (!license) {
    return 'NEEDS_GENERATION (license not acceptable)';
  }
  await sleep(REQUEST_DELAY_MS);

  // Step 3: download
  mkdirSync(dir, { recursive: true });
  try {
    await downloadTo(summary.imageUrl, samplePath, ua);
  } catch (e) {
    return `download failed: ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 4: write license sidecar
  const sidecar: ImageLicenseRecord = {
    source: 'wikimedia',
    license: license.license,
    attribution: license.attribution,
    source_url: license.pageUrl ?? summary.pageUrl,
    fetched_at: new Date().toISOString(),
  };
  writeFileSync(licensePath, JSON.stringify(sidecar, null, 2) + '\n');

  // Step 5: update data.json with image_primary + image_alt
  const el = loadData(seed);
  const updated: Element = {
    ...el,
    image_primary: 'images/sample.jpg',
    image_alt: `${seed.name} (${seed.symbol}) — image from Wikimedia Commons (${license.license}).`,
  };
  saveData(seed, updated);

  return `wikimedia (${license.license})`;
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

  const successes: string[] = [];
  const needsGen: string[] = [];
  const failures: Array<{ symbol: string; reason: string }> = [];

  for (const seed of ELEMENT_SEED) {
    process.stdout.write(`  ${seed.symbol.padEnd(3)} ${seed.name.padEnd(16)} `);
    try {
      const result = await processElement(seed, ua);
      console.log(result);
      if (result === 'exists' || result.startsWith('wikimedia')) {
        successes.push(seed.symbol);
      } else if (result.startsWith('NEEDS_GENERATION')) {
        needsGen.push(seed.symbol);
      } else {
        failures.push({ symbol: seed.symbol, reason: result });
      }
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      console.log(`FAIL: ${reason}`);
      failures.push({ symbol: seed.symbol, reason });
    }
    await sleep(REQUEST_DELAY_MS);
  }

  console.log(
    `\n✓ ${successes.length} from Wikimedia, ${needsGen.length} need nano-banana, ${failures.length} hard failures`,
  );
  if (needsGen.length > 0) console.log(`  needs gen: ${needsGen.join(', ')}`);
  if (failures.length > 0) {
    console.log(`  failures:`);
    for (const f of failures) console.log(`    ${f.symbol}: ${f.reason}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
