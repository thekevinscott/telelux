import { expect, test } from '@playwright/test';

test.describe('the telelux-transcript element over the shared fixture corpus', () => {
  test('renders every block of the slotted sample to the recorded DOM', async ({ page }) => {
    await page.goto('/slot.html');
    await expect(page.locator('telelux-message')).toHaveCount(30);

    const blocks = await page.locator('telelux-message').evaluateAll((elements) =>
      elements.map((element) =>
        (element.shadowRoot?.querySelector('article')?.outerHTML ?? '')
          .replace(/<!--[^]*?-->/g, '')
          .replace(/>\s+</g, '><')
          .trim(),
      ),
    );

    expect(`${blocks.join('\n')}\n`).toMatchSnapshot(['claude-code', 'sample.blocks.html']);
  });
});
