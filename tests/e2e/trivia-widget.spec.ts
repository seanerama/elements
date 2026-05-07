import { test, expect } from '@playwright/test';

test.describe('Stage 6 — Embedded Trivia Widget', () => {
  test('widget loads on element detail page with a question', async ({ page }) => {
    await page.goto('/elements/c');
    // Scroll to widget
    const widget = page.locator('section').filter({ hasText: 'Test Yourself' }).first();
    await widget.scrollIntoViewIfNeeded();
    await expect(widget).toBeVisible();
    // Question prompt appears within ~5s after island hydrates + fetches
    await expect(widget).toContainText(/What|Which|Identify/i, { timeout: 5000 });
  });

  test('answer buttons render four options', async ({ page }) => {
    await page.goto('/elements/h');
    const widget = page.locator('section').filter({ hasText: 'Test Yourself' }).first();
    await widget.scrollIntoViewIfNeeded();
    await expect(widget).toBeVisible();
    // Wait for options to render
    await page.waitForSelector('section:has-text("Test Yourself") button', { timeout: 5000 });
    const options = widget.locator('button').filter({ hasNotText: /Next|Play/i });
    expect(await options.count()).toBeGreaterThanOrEqual(4);
  });

  test('clicking an answer reveals correct/wrong feedback', async ({ page }) => {
    await page.goto('/elements/au');
    const widget = page.locator('section').filter({ hasText: 'Test Yourself' }).first();
    await widget.scrollIntoViewIfNeeded();
    await expect(widget).toBeVisible();
    await page.waitForSelector('section:has-text("Test Yourself") button', { timeout: 5000 });
    const options = widget.locator('button').filter({ hasNotText: /Next|Play/i });
    await options.first().click();
    // Feedback area should appear with status text
    await expect(widget.locator('[role="status"]')).toBeVisible({ timeout: 3000 });
  });
});
