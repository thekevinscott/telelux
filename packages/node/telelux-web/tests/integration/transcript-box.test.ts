import { expect, test } from '@playwright/test';

test.describe('the viewer page', () => {
  test('displays the transcript text in a black box', async ({ page }) => {
    await page.goto('/');

    const box = page.getByTestId('transcript-box');
    await expect(box).toBeVisible();
    await expect(box).toContainText('"type":"user"');
    await expect(box).toHaveCSS('background-color', 'rgb(0, 0, 0)');
    await expect(box).toHaveCSS('color', 'rgb(255, 255, 255)');
    await expect(box).toHaveCSS('white-space', 'pre-wrap');
  });
});
