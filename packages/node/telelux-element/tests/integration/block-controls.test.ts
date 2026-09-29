import { expect, test } from '@playwright/test';

test.describe('the per-block controls in a real browser', () => {
  test('opens the metadata popover, closes it with Escape, and shows the raw view', async ({ page }) => {
    await page.goto('/slot.html');
    const block = page.locator('telelux-message').first();

    const toggle = block.getByRole('button', { name: 'Metadata' });
    await toggle.click();
    const popover = block.getByRole('dialog', { name: 'Message Metadata - Block 0' });
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('queue-operation');
    await expect(popover).toContainText('2026-09-09T00:14:29.195Z');

    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(toggle).toBeFocused();

    await block.getByRole('button', { name: 'Raw' }).click();
    await expect(block.locator('.raw')).toBeVisible();
    await expect(block.locator('.raw')).toContainText('"role": "user"');
  });

  test('reaches every control by keyboard, in order', async ({ page }) => {
    await page.goto('/slot.html');
    const block = page.locator('telelux-message').first();

    await block.getByRole('button', { name: 'Formatted text' }).focus();
    await page.keyboard.press('Tab');
    await expect(block.getByRole('button', { name: 'Metadata' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(block.getByRole('button', { name: 'Raw' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(block.locator('.raw')).toBeVisible();
  });
});
