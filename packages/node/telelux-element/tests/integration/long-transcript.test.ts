import { expect, test } from '@playwright/test';

test.describe('the telelux-transcript element with 500 messages', () => {
  test('renders every block and scrolls to the last one', async ({ page }) => {
    await page.goto('/long.html');

    const blocks = page.locator('telelux-transcript telelux-message');
    await expect(blocks).toHaveCount(500);

    const labels = await blocks.locator('.label').allTextContents();
    expect(labels).toHaveLength(500);
    expect(labels[0]).toBe('Block 0 | User');
    expect(labels[499]).toBe('Block 499 | System');

    const last = blocks.nth(499);
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport();
    await expect(last.locator('.content')).toHaveText('Message 499');
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
});
