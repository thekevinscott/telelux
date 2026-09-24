import { expect, test } from '@playwright/test';

test.describe('the tele-lux element in a real page', () => {
  test('renders hello world', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('tele-lux')).toContainText('hello world');
  });
});
