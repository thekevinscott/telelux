import { expect, test } from '@playwright/test';

test.describe('the telelux-transcript element in a real page', () => {
  test('shows the first message of a transcript assigned from a script', async ({ page }) => {
    await page.goto('/');

    const element = page.locator('telelux-transcript');
    await expect(element.locator('li').first()).toContainText('What time is it in Tokyo?');
    await expect(element.locator('li')).toHaveCount(4);
  });
});
