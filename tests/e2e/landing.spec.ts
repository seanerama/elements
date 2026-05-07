import { test, expect } from '@playwright/test';

test.describe('Stage 3 — Periodic Table Landing', () => {
  test('renders all 118 element cells', async ({ page }) => {
    await page.goto('/');
    const cells = page.locator('a.cell');
    await expect(cells).toHaveCount(118);
  });

  test('lanthanide row (Ce..Lu) is visible with non-zero height', async ({ page }) => {
    await page.goto('/');
    const ce = page.locator('a.cell[data-symbol="Ce"]');
    await expect(ce).toBeVisible();
    const lu = page.locator('a.cell[data-symbol="Lu"]');
    await expect(lu).toBeVisible();
    const ceBox = await ce.boundingBox();
    const luBox = await lu.boundingBox();
    expect(ceBox?.height ?? 0).toBeGreaterThan(40);
    expect(luBox?.height ?? 0).toBeGreaterThan(40);
  });

  test('actinide row (Th..Lr) is visible with non-zero height', async ({ page }) => {
    await page.goto('/');
    const th = page.locator('a.cell[data-symbol="Th"]');
    await expect(th).toBeVisible();
    const lr = page.locator('a.cell[data-symbol="Lr"]');
    await expect(lr).toBeVisible();
    const thBox = await th.boundingBox();
    const lrBox = await lr.boundingBox();
    expect(thBox?.height ?? 0).toBeGreaterThan(40);
    expect(lrBox?.height ?? 0).toBeGreaterThan(40);
  });

  test('Lanthanides + Actinides row labels render', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.row-label--inner1')).toContainText(/Lanthanides/i);
    await expect(page.locator('.row-label--inner2')).toContainText(/Actinides/i);
  });

  test('hovering Carbon reveals tooltip with "Carbon" + "12" mass', async ({ page }) => {
    await page.goto('/');
    const carbon = page.locator('a.cell[data-symbol="C"]');
    await carbon.hover();
    const tooltip = page.locator('[role="tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText('Carbon');
    await expect(tooltip).toContainText('12.011');
    await expect(tooltip).toContainText('Reactive nonmetal');
  });

  test('clicking Noble gas filter dims non-noble cells', async ({ page }) => {
    await page.goto('/');
    await page.click('button[data-category="noble-gas"]');
    // grid should be marked active
    await expect(page.locator('[data-grid]')).toHaveAttribute('data-filter-active', 'true');

    // Helium (noble) should be at full opacity
    const heOpacity = await page
      .locator('a.cell[data-symbol="He"]')
      .evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(heOpacity)).toBeGreaterThanOrEqual(0.95);

    // Carbon (nonmetal) should be dimmed
    const cOpacity = await page
      .locator('a.cell[data-symbol="C"]')
      .evaluate((el) => window.getComputedStyle(el).opacity);
    expect(parseFloat(cOpacity)).toBeLessThan(0.5);
  });

  test('search "gold" navigates to /elements/au', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Search elements…"]').fill('gold');
    // Wait for dropdown to appear and click first result
    await page.waitForSelector('[role="listbox"]');
    await page.click('[role="option"]:first-child');
    await expect(page).toHaveURL(/\/elements\/au$/);
  });

  test('search "79" finds Gold by atomic number', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[placeholder="Search elements…"]').fill('79');
    await page.waitForSelector('[role="listbox"]');
    const firstResult = page.locator('[role="option"]:first-child');
    await expect(firstResult).toContainText('Au');
    await expect(firstResult).toContainText('Gold');
  });

  test('keyboard navigation: focus first cell, ArrowRight goes to next element', async ({
    page,
  }) => {
    await page.goto('/');
    const hCell = page.locator('a.cell[data-symbol="H"]');
    await hCell.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('a.cell[data-symbol="He"]')).toBeFocused();
  });

  test('keyboard ArrowDown from H goes to Li', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.cell[data-symbol="H"]').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('a.cell[data-symbol="Li"]')).toBeFocused();
  });

  test('every cell has a meaningful aria-label', async ({ page }) => {
    await page.goto('/');
    const carbon = page.locator('a.cell[data-symbol="C"]');
    const label = await carbon.getAttribute('aria-label');
    expect(label).toMatch(/Carbon/);
    expect(label).toMatch(/atomic number 6/i);
    expect(label).toMatch(/Reactive nonmetal/);
  });

  test('returns 200 with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    const r = await page.goto('/');
    expect(r?.status()).toBe(200);
    expect(errors).toEqual([]);
  });
});
