import { test, expect } from '@playwright/test';

const KB = 1024;

test.describe('Bundle budgets (Stage 8)', () => {
  test('landing page initial JS payload ≤ 80 KB gzipped', async ({ page }) => {
    let totalJsBytes = 0;
    page.on('response', async (resp) => {
      const url = resp.url();
      if (!/\.js(\?|$)/.test(url)) return;
      // Only count what's loaded on initial render — request types 'script'
      const req = resp.request();
      if (req.resourceType() !== 'script') return;
      const enc = resp.headers()['content-encoding'] ?? '';
      const lenHeader = resp.headers()['content-length'];
      const len = lenHeader ? Number.parseInt(lenHeader, 10) : 0;
      if (enc.includes('gzip') || enc.includes('br') || enc.includes('zstd')) {
        // server already compressed — content-length is wire size
        totalJsBytes += len;
      } else {
        // approximate: gzip of plain JS is roughly 30% of size
        const buf = await resp.body().catch(() => null);
        if (buf) totalJsBytes += Math.round(buf.length * 0.32);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(totalJsBytes, `landing JS bytes ≈ ${totalJsBytes}`).toBeLessThanOrEqual(80 * KB);
  });

  test('element-detail page initial JS payload ≤ 100 KB gzipped', async ({ page }) => {
    let totalJsBytes = 0;
    page.on('response', async (resp) => {
      const url = resp.url();
      if (!/\.js(\?|$)/.test(url)) return;
      if (resp.request().resourceType() !== 'script') return;
      const enc = resp.headers()['content-encoding'] ?? '';
      const lenHeader = resp.headers()['content-length'];
      const len = lenHeader ? Number.parseInt(lenHeader, 10) : 0;
      if (enc.includes('gzip') || enc.includes('br') || enc.includes('zstd')) {
        totalJsBytes += len;
      } else {
        const buf = await resp.body().catch(() => null);
        if (buf) totalJsBytes += Math.round(buf.length * 0.32);
      }
    });

    await page.goto('/elements/h');
    await page.waitForLoadState('networkidle');
    expect(totalJsBytes, `detail JS bytes ≈ ${totalJsBytes}`).toBeLessThanOrEqual(100 * KB);
  });
});
