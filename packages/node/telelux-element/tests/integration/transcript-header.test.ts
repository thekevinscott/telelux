import { expect, test } from '@playwright/test';

test.describe('the transcript header and block navigation in a real browser', () => {
  test('jumps to a typed block, then steps on with J and back with K', async ({ page }) => {
    await page.goto('/long.html');
    const items = page.locator('telelux-transcript ol > li');
    await expect(items).toHaveCount(500);

    const input = page.getByRole('spinbutton', { name: 'Jump to block' });
    await input.fill('250');
    await input.press('Enter');
    await expect(items.nth(250)).toHaveClass('highlight');
    await expect(items.nth(250)).toBeInViewport();

    await items.nth(250).locator('.content').click();
    await page.keyboard.press('j');
    await expect(items.nth(251)).toHaveClass('highlight');
    await expect(items.nth(251)).toBeInViewport();
    await expect(items.nth(250)).not.toHaveClass('highlight');

    await page.keyboard.press('k');
    await page.keyboard.press('k');
    await expect(items.nth(249)).toHaveClass('highlight');
    await expect(items.nth(249)).toBeInViewport();
  });

  test('keeps the Previous and Next controls on screen while scrolling', async ({ page }) => {
    await page.goto('/long.html');
    const next = page.getByRole('button', { name: 'Next block' });
    await expect(next).toBeInViewport();
    await page.mouse.wheel(0, 20000);
    await expect(next).toBeInViewport();
    await next.click();
    await expect(page.locator('telelux-transcript ol > li.highlight')).toBeInViewport();
  });

  test('copies the transcript id to the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/slot.html');
    const copy = page.getByRole('button', { name: 'Copy transcript id' });
    await copy.click();
    await expect(copy).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('session_redacted_02');
  });

  test('shows usage totals and opens the transcript metadata', async ({ page }) => {
    await page.goto('/slot.html');
    const totals = page.locator('telelux-transcript .totals');
    await expect(totals).toContainText('Input tokens');
    await expect(totals).toContainText('Output tokens');
    await expect(totals).toContainText('Tool calls');

    const toggle = page.getByRole('button', { name: /^Metadata \(\d+\)$/ });
    await toggle.click();
    const popover = page.getByRole('dialog', { name: 'Transcript Metadata' });
    await expect(popover).toContainText('claude-code');
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});
