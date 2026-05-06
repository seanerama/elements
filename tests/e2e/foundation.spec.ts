import { test, expect } from '@playwright/test';

test.describe('Stage 1 — Foundation', () => {
  test('home page renders the wordmark', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.wordmark')).toBeVisible();
    await expect(page.locator('.wordmark')).toHaveText(/elements/i);
  });

  test('html element has data-theme="retro-science"', async ({ page }) => {
    await page.goto('/');
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('retro-science');
  });

  test('design tokens are applied to the document', async ({ page }) => {
    await page.goto('/');
    const paper = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-paper').trim(),
    );
    expect(paper.toLowerCase()).toBe('#f5f0e6');

    const ink = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-ink').trim(),
    );
    expect(ink.toLowerCase()).toBe('#1f1d18');
  });

  test('IBM Plex font family is in use', async ({ page }) => {
    await page.goto('/');
    const fontFamily = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
    expect(fontFamily).toMatch(/plex sans/i);
  });

  test('serves a 200 response with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(errors).toEqual([]);
  });
});
