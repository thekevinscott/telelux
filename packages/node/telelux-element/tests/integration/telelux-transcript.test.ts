import { expect, test } from '@playwright/test';

test.describe('the telelux-transcript element in a real page', () => {
  test('renders hello world', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('telelux-transcript')).toContainText('hello world');
  });
});
