import { expect, test } from '@playwright/test';

test.describe('the timeline in a real browser', () => {
  test('scrolls the transcript to a clicked event and outlines its span', async ({ page }) => {
    await page.goto('/timeline.html');
    const items = page.locator('telelux-transcript ol > li');
    await expect(items).toHaveCount(300);
    const timeline = page.getByRole('region', { name: 'Timeline' });
    await expect(timeline.getByText('Timeline (5 events)')).toBeVisible();

    await timeline.getByRole('button', { name: 'Lands the working fix, blocks 200–240' }).click();
    await expect(items.nth(200)).toBeInViewport();
    await expect(items.nth(200)).toHaveClass('highlight');
    await expect(items.nth(240)).toHaveClass('highlight');
    await expect(items.nth(241)).not.toHaveClass('highlight');
  });

  test('stacks overlapping events and widens the axis on zoom', async ({ page }) => {
    await page.goto('/timeline.html');
    const timeline = page.getByRole('region', { name: 'Timeline' });
    const attempt = await timeline.getByRole('button', { name: /^Tries a fix/ }).boundingBox();
    const detour = await timeline.getByRole('button', { name: /^Investigates/ }).boundingBox();
    expect(attempt).not.toBeNull();
    expect(detour).not.toBeNull();
    expect((detour?.y ?? 0) - (attempt?.y ?? 0)).toBeGreaterThanOrEqual(20);

    const scroller = timeline.locator('.scroller');
    const before = await scroller.evaluate((node) => node.scrollWidth);
    await timeline.getByRole('button', { name: 'Zoom in' }).click();
    await timeline.getByRole('button', { name: 'Zoom in' }).click();
    await expect(timeline.getByText('4×')).toBeVisible();
    const after = await scroller.evaluate((node) => node.scrollWidth);
    expect(after).toBeGreaterThanOrEqual(before * 3.9);
  });
});
