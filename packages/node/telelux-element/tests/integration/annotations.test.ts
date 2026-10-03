import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test.describe('annotations in a real browser', () => {
  test('renders each annotation under the block it anchors to and lists the rest', async ({ page }) => {
    await page.goto('/annotations.html');
    const items = page.locator('telelux-transcript ol > li');
    await expect(items).toHaveCount(4);
    await expect(items.nth(1).locator('telelux-annotation')).toHaveCount(2);
    await expect(items.nth(1).getByRole('article', { name: 'Annotation test-tampering' })).toContainText('Blocks 1–3');
    await expect(items.nth(1).getByRole('article', { name: 'Annotation exploration' })).toContainText('human: kevin');
    await expect(page.locator('telelux-transcript .unanchored')).toContainText('The start anchor matches no message.');
  });

  test('filters the cards by status and source', async ({ page }) => {
    await page.goto('/annotations.html');
    const cards = page.locator('telelux-transcript telelux-annotation');
    await expect(cards).toHaveCount(3);
    await page.getByRole('combobox', { name: 'Filter by source' }).selectOption('human: kevin');
    await expect(cards).toHaveCount(1);
    await page.getByRole('combobox', { name: 'Filter by status' }).selectOption('confirmed');
    await expect(cards).toHaveCount(0);
    await expect(page.getByText('Annotations (0 of 3)')).toBeVisible();
  });

  test('downloads the sidecar with the decision recorded', async ({ page }) => {
    await page.goto('/annotations.html');
    await page.getByRole('textbox', { name: 'Reviewer' }).fill('kevin');
    const card = page.locator('telelux-transcript ol > li').nth(1).getByRole('article', { name: 'Annotation test-tampering' });
    await card.getByRole('textbox', { name: 'Review note' }).fill('Line 1 was edited.');
    await card.getByRole('button', { name: 'Confirm' }).click();
    await expect(card).toContainText('Confirmed by kevin');

    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download annotations' }).click()]);
    expect(download.suggestedFilename()).toBe('review-demo.annotations.json');
    const saved = JSON.parse(await readFile(await download.path(), 'utf8'));
    expect(saved.annotations[0].resolution).toMatchObject({ state: 'confirmed', by: 'kevin', note: 'Line 1 was edited.' });
    expect(saved.annotations[1]).not.toHaveProperty('resolution');
  });
});
