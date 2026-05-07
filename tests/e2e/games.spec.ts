import { test, expect } from '@playwright/test';

test.describe('Stage 7 — Standalone Game Pages', () => {
  test('/games index shows both game cards', async ({ page }) => {
    await page.goto('/games');
    await expect(page.locator('[data-testid="gamecard-element"]')).toBeVisible();
    await expect(page.locator('[data-testid="gamecard-compound"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Trivia');
  });

  test('clicking element card navigates to /games/element', async ({ page }) => {
    await page.goto('/games');
    await page.click('[data-testid="gamecard-element"]');
    await expect(page).toHaveURL(/\/games\/element$/);
  });

  test('/games/element renders a question and input', async ({ page }) => {
    await page.goto('/games/element');
    // Wait for question to render after data fetch + hydration
    await expect(page.locator('input[aria-label="Your answer"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Score|Streak/i').first()).toBeVisible();
  });

  test('/games/element wrong answer shows feedback then advances on Next', async ({ page }) => {
    await page.goto('/games/element');
    const input = page.locator('input[aria-label="Your answer"]');
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('XYZ-not-an-element');
    await page.click('button[type="submit"]');
    // Feedback appears
    await expect(page.locator('[role="status"]')).toBeVisible({ timeout: 3000 });
    // Streak should reset / stay at 0
    await expect(page.locator('text=Streak').first()).toBeVisible();
    // Click Next
    const nextBtn = page.getByRole('button', { name: /Next|See result/ });
    await nextBtn.click();
    // Either next question OR results screen
    const stillPlaying = await page.locator('input[aria-label="Your answer"]').isVisible();
    const onResults = await page.locator('text=/Round complete/i').isVisible();
    expect(stillPlaying || onResults).toBe(true);
  });

  test('/games/compound renders separately', async ({ page }) => {
    await page.goto('/games/compound');
    await expect(page.locator('text=Guess the Compound').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[aria-label="Your answer"]')).toBeVisible({ timeout: 10000 });
  });

  test('high score displays correctly after a completed round', async ({ page }) => {
    // Set localStorage directly to simulate prior play
    await page.goto('/games');
    await page.evaluate(() => {
      window.localStorage.setItem(
        'elements:trivia:element',
        JSON.stringify({
          schema_version: '1.0.0',
          bestStreak: 7,
          highScore: 9,
          totalGames: 3,
          totalCorrect: 22,
          totalAnswered: 30,
        }),
      );
    });
    await page.reload();
    const card = page.locator('[data-testid="gamecard-element"]');
    await expect(card).toContainText('7'); // bestStreak
    await expect(card).toContainText('9'); // highScore
  });
});
