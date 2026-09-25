import { expect, test } from '@playwright/test';

test.describe('the telelux-transcript element fed by its slot alone', () => {
  test('shows the first message of the slotted JSONL with no glue script', async ({ page }) => {
    await page.goto('/slot.html');

    const element = page.locator('telelux-transcript');
    await expect(element.locator('li').first()).toContainText('Port reference_implementation/ to typescript');
    await expect(element.locator('li')).toHaveCount(30);
  });
});
