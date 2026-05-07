import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

test.describe('Stage 5 — 3D Orbital Visualization', () => {
  test('Three.js bundle is in a separate chunk', async () => {
    const chunkDir = resolve(process.cwd(), 'dist/client/_astro');
    const files = readdirSync(chunkDir).filter((f) => f.endsWith('.js'));
    const threeChunks = files.filter((f) => {
      const content = readFileSync(resolve(chunkDir, f), 'utf-8');
      // Three.js shows up via REVISION constant or many class identifiers
      return /THREE|REVISION/.test(content) && content.length > 100_000;
    });
    expect(
      threeChunks.length,
      `expected exactly one chunk with Three.js, got ${threeChunks.join(',')}`,
    ).toBe(1);
  });

  test('initial /elements/h/ does NOT load Three.js chunk', async ({ page }) => {
    const requestUrls: string[] = [];
    page.on('request', (req) => requestUrls.push(req.url()));
    await page.goto('/elements/h');
    await page.waitForLoadState('networkidle');
    const threeRequest = requestUrls.find((u) => /Atom\..+\.js/.test(u));
    expect(threeRequest, 'Three.js chunk should NOT be loaded on initial render').toBeUndefined();
  });

  test('clicking "View 3D orbital" reveals canvas', async ({ page }) => {
    await page.goto('/elements/c');
    const toggle = page.locator('[data-testid="orbital-toggle"]');
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toBeVisible();
    await toggle.click();
    // Wait for canvas to appear (Three.js chunk + R3F mount)
    await page.waitForSelector('canvas', { timeout: 15000 });
    const canvas = page.locator('canvas').first();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('toggle aria-expanded updates correctly', async ({ page }) => {
    await page.goto('/elements/u');
    const toggle = page.locator('[data-testid="orbital-toggle"]');
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('toggle button has correct text states', async ({ page }) => {
    await page.goto('/elements/fe');
    const toggle = page.locator('[data-testid="orbital-toggle"]');
    await toggle.scrollIntoViewIfNeeded();
    await expect(toggle).toContainText('View 3D orbital');
    await toggle.click();
    await expect(toggle).toContainText('Hide 3D orbital');
  });
});
