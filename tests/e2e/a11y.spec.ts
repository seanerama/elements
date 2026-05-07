import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/elements/h', '/elements/au', '/elements/og', '/games', '/games/element'];

for (const route of ROUTES) {
  test(`a11y — ${route}`, async ({ page }) => {
    await page.goto(route);
    // Wait for client islands to hydrate
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    const critical = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );

    if (critical.length > 0) {
      console.log(
        `Violations on ${route}:`,
        critical.map((v) => `${v.id} (${v.impact}): ${v.help}`).join('\n  '),
      );
    }

    expect(critical, `axe violations on ${route}`).toHaveLength(0);
  });
}

test('skip-to-content link is the first focusable element', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.textContent);
  expect(focused).toMatch(/Skip to content/i);
});
