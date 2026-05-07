import { test, expect } from '@playwright/test';

test.describe('Stage 4 — Element Detail Pages', () => {
  test('/elements/h renders Hydrogen with electron shell of [1]', async ({ page }) => {
    await page.goto('/elements/h');
    await expect(page.locator('h1')).toContainText('H');
    // Hero name
    await expect(page.locator('.hero')).toContainText('Hydrogen');
    // 1 electron in Bohr SVG
    const electrons = page.locator('svg.bohr circle[fill*="prussian"]');
    await expect(electrons).toHaveCount(1);
  });

  test('/elements/c (Carbon) renders ≥3 compounds and uses', async ({ page }) => {
    await page.goto('/elements/c');
    await expect(page.locator('h1')).toContainText('C');
    const compounds = page.locator('.compound-list > li');
    expect(await compounds.count()).toBeGreaterThanOrEqual(3);
    const uses = page.locator('.uses-list > li');
    expect(await uses.count()).toBeGreaterThanOrEqual(3);
  });

  test('/elements/au (Gold) renders image + attribution caption', async ({ page }) => {
    await page.goto('/elements/au');
    await expect(page.locator('img')).toBeVisible();
    await expect(page.locator('.attribution')).toBeVisible();
    await expect(page.locator('.attribution')).toContainText('Wikimedia');
  });

  test('/elements/og (Oganesson) renders without image — placeholder only', async ({ page }) => {
    await page.goto('/elements/og');
    await expect(page.locator('h1')).toContainText('Og');
    await expect(page.locator('.image--placeholder')).toBeVisible();
    // No console errors
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.reload();
    expect(errors).toEqual([]);
  });

  test('prev/next navigation: H next → He, He prev → H', async ({ page }) => {
    await page.goto('/elements/h');
    // First page has no prev (disabled)
    await expect(page.locator('a[rel="next"]')).toHaveAttribute('href', '/elements/he');
    await page.click('a[rel="next"]');
    await expect(page).toHaveURL(/\/elements\/he$/);
    await expect(page.locator('a[rel="prev"]')).toHaveAttribute('href', '/elements/h');
  });

  test('/elements/og has no next link (last element)', async ({ page }) => {
    await page.goto('/elements/og');
    // The disabled-next is rendered as a span, not an <a>
    const nextLinks = page.locator('a[rel="next"]');
    expect(await nextLinks.count()).toBe(0);
  });

  test('Bohr diagram for U (uranium) has 7 shells with correct counts', async ({ page }) => {
    await page.goto('/elements/u');
    // 7 shell rings (concentric circles, stroked)
    const shellRings = page.locator('svg.bohr circle[stroke*="rule"]');
    await expect(shellRings).toHaveCount(7);
    // Total electrons = 92
    const electrons = page.locator('svg.bohr circle[fill*="prussian"]');
    await expect(electrons).toHaveCount(92);
  });

  test('formula H2O renders with subscript', async ({ page }) => {
    await page.goto('/elements/h');
    // H2O is one of the listed compounds for hydrogen
    const subs = page.locator('.compound-list .formula sub');
    expect(await subs.count()).toBeGreaterThan(0);
  });
});
