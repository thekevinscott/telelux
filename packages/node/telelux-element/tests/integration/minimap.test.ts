import { expect, type Locator, test } from '@playwright/test';

async function insideStrip(chip: Locator, strip: Locator) {
  const [chipBox, stripBox] = await Promise.all([chip.boundingBox(), strip.boundingBox()]);
  expect(chipBox).not.toBeNull();
  expect(stripBox).not.toBeNull();
  if (chipBox !== null && stripBox !== null) {
    expect(chipBox.x).toBeGreaterThanOrEqual(stripBox.x);
    expect(chipBox.x + chipBox.width).toBeLessThanOrEqual(stripBox.x + stripBox.width);
  }
}

test.describe('the minimap in a real browser', () => {
  test('jumps to a clicked chip past the fold and keeps it outlined and in view', async ({ page }) => {
    await page.goto('/long.html');
    const items = page.locator('telelux-transcript ol > li');
    await expect(items).toHaveCount(500);
    const strip = page.getByRole('toolbar', { name: 'Minimap' });
    const chip = strip.getByRole('button', { name: 'Block 400 user', exact: true });

    await chip.click();
    await expect(items.nth(400)).toBeInViewport();
    await expect(items.nth(400)).toHaveClass('highlight');
    await expect(chip).toHaveAttribute('aria-current', 'true');
    await insideStrip(chip, strip);
  });

  test('follows the page as it scrolls and scrolls the strip to the current chip', async ({ page }) => {
    await page.goto('/long.html');
    const strip = page.getByRole('toolbar', { name: 'Minimap' });
    await expect(strip.getByRole('button', { name: 'Block 0 user', exact: true })).toHaveAttribute('aria-current', 'true');
    await page.getByRole('spinbutton', { name: 'Jump to block' }).fill('450');
    await page.getByRole('spinbutton', { name: 'Jump to block' }).press('Enter');
    const current = strip.getByRole('button', { name: 'Block 450 tool', exact: true });
    await expect(current).toHaveAttribute('aria-current', 'true');
    await expect(page.locator('telelux-transcript ol > li').nth(450)).toBeInViewport();
    await expect.poll(() => page.evaluate(() => new Promise((settled) => {
      const before = window.scrollY;
      setTimeout(() => settled(window.scrollY === before), 100);
    }))).toBe(true);
    await page.mouse.wheel(0, 2000);
    await expect(current).not.toHaveAttribute('aria-current', 'true');
    const outlined = strip.locator('[aria-current="true"]');
    await expect(outlined).toHaveCount(1);
    await insideStrip(outlined, strip);
  });

  test('moves between chips with the arrow keys and jumps with Enter', async ({ page }) => {
    await page.goto('/long.html');
    const strip = page.getByRole('toolbar', { name: 'Minimap' });
    await strip.getByRole('button', { name: 'Block 0 user', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect(strip.getByRole('button', { name: 'Block 2 tool', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('telelux-transcript ol > li').nth(2)).toHaveClass('highlight');
  });

  test('fills each chip with its role colour', async ({ page }) => {
    await page.goto('/long.html');
    const strip = page.getByRole('toolbar', { name: 'Minimap' });
    const colours = await Promise.all(
      ['Block 0 user', 'Block 1 assistant', 'Block 2 tool', 'Block 3 system'].map((name) =>
        strip.getByRole('button', { name, exact: true }).evaluate((chip) => getComputedStyle(chip).backgroundColor),
      ),
    );
    expect(colours).toEqual(['rgb(209, 213, 219)', 'rgb(147, 197, 253)', 'rgb(134, 239, 172)', 'rgb(253, 186, 116)']);
  });
});
