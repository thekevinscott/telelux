import { expect, type Page, test } from '@playwright/test';

const LIGHT = {
  foreground: 'rgb(17, 24, 39)',
  user: ['rgb(209, 213, 219)', 'rgb(249, 250, 251)'],
  assistant: ['rgb(147, 197, 253)', 'rgb(239, 246, 255)'],
  system: ['rgb(253, 186, 116)', 'rgb(255, 247, 237)'],
  tool: ['rgb(134, 239, 172)', 'rgb(240, 253, 244)'],
};

const DARK = {
  foreground: 'rgb(243, 244, 246)',
  user: ['rgb(75, 85, 99)', 'rgb(31, 41, 55)'],
  assistant: ['rgb(59, 130, 246)', 'rgb(23, 37, 84)'],
  system: ['rgb(249, 115, 22)', 'rgb(67, 20, 7)'],
  tool: ['rgb(34, 197, 94)', 'rgb(5, 46, 22)'],
};

async function roleColours(page: Page) {
  return page.locator('telelux-message').evaluateAll((elements) => {
    const seen: Record<string, [string, string]> = {};
    for (const element of elements) {
      const block = element.shadowRoot?.querySelector<HTMLElement>('.block');
      if (block?.dataset.role !== undefined) {
        const style = getComputedStyle(block);
        seen[block.dataset.role] = [style.borderLeftColor, style.backgroundColor];
      }
    }
    return seen;
  });
}

async function foreground(page: Page) {
  return page.locator('telelux-message').first().evaluate((element) => getComputedStyle(element.shadowRoot?.querySelector('.content') as Element).color);
}

async function setTheme(page: Page, theme: string | undefined) {
  await page.locator('telelux-transcript').evaluate((element, value) => {
    if (value === undefined) {
      element.removeAttribute('theme');
    } else {
      element.setAttribute('theme', value);
    }
  }, theme);
}

test.describe('theming the fixture transcript in a real browser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/slot.html');
    await expect(page.locator('telelux-message')).toHaveCount(30);
  });

  test('uses the light defaults', async ({ page }) => {
    const colours = await roleColours(page);
    expect(colours).toEqual({ user: LIGHT.user, assistant: LIGHT.assistant, system: LIGHT.system, tool: LIGHT.tool });
    expect(await foreground(page)).toBe(LIGHT.foreground);
  });

  test('switches every block to the dark defaults with theme="dark"', async ({ page }) => {
    await setTheme(page, 'dark');
    await expect.poll(() => foreground(page)).toBe(DARK.foreground);
    expect(await roleColours(page)).toEqual({ user: DARK.user, assistant: DARK.assistant, system: DARK.system, tool: DARK.tool });
    expect(await page.locator('telelux-transcript').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe('rgb(17, 24, 39)');
  });

  test('keeps a role override in the dark theme', async ({ page }) => {
    await setTheme(page, 'dark');
    await page.locator('telelux-transcript').evaluate((element) => element.style.setProperty('--telelux-assistant-border', 'rgb(255, 0, 0)'));
    await expect.poll(async () => (await roleColours(page)).assistant).toEqual(['rgb(255, 0, 0)', DARK.assistant[1]]);
    expect((await roleColours(page)).user).toEqual(DARK.user);
  });

  test('inherits an override set on an ancestor', async ({ page }) => {
    await page.evaluate(() => document.body.style.setProperty('--telelux-tool-background', 'rgb(1, 2, 3)'));
    expect((await roleColours(page)).tool).toEqual([LIGHT.tool[0], 'rgb(1, 2, 3)']);
  });

  test('follows the dark colour scheme preference until a theme is set', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    expect(await foreground(page)).toBe(DARK.foreground);
    expect((await roleColours(page)).assistant).toEqual(DARK.assistant);
    await setTheme(page, 'light');
    await expect.poll(() => foreground(page)).toBe(LIGHT.foreground);
    expect((await roleColours(page)).assistant).toEqual(LIGHT.assistant);
  });

  test('lets the page restyle the exported parts', async ({ page }) => {
    await page.addStyleTag({
      content: `
        telelux-transcript::part(tool-call) { outline: 3px solid rgb(0, 128, 0); }
        telelux-transcript::part(block-system) { opacity: 0.5; }
        telelux-transcript::part(transcript-header) { letter-spacing: 2px; }
      `,
    });
    const toolCall = page.locator('telelux-message .tool-call').first();
    await expect(toolCall).toHaveCSS('outline-color', 'rgb(0, 128, 0)');
    await expect(page.locator('telelux-message .block[data-role="system"]').first()).toHaveCSS('opacity', '0.5');
    await expect(page.locator('telelux-message .block[data-role="user"]').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('telelux-transcript header.header')).toHaveCSS('letter-spacing', '2px');
  });
});
