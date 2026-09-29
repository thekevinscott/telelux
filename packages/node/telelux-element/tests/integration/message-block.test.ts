import { expect, test } from '@playwright/test';

test.describe('a telelux-message block in a real browser', () => {
  test('colours the block by role and collapses its reasoning', async ({ page }) => {
    await page.goto('/');

    const assistant = page.locator('telelux-message').nth(1);
    const block = assistant.locator('.block');
    await expect(block).toHaveCSS('border-left-color', 'rgb(147, 197, 253)');
    await expect(block).toHaveCSS('background-color', 'rgb(239, 246, 255)');
    await expect(assistant.locator('.code')).toHaveText('clock(zone=Asia/Tokyo)');

    const reasoning = assistant.locator('.reasoning-text');
    await expect(reasoning).toBeVisible();
    await assistant.getByText('Reasoning', { exact: true }).click();
    await expect(reasoning).toBeHidden();
  });

  test('takes role colours from custom properties on the host', async ({ page }) => {
    await page.goto('/');
    await page.locator('telelux-transcript').evaluate((el) => {
      (el as HTMLElement).style.setProperty('--telelux-tool-border', 'rgb(1, 2, 3)');
    });

    await expect(page.locator('telelux-message').nth(2).locator('.block')).toHaveCSS('border-left-color', 'rgb(1, 2, 3)');
  });
});
