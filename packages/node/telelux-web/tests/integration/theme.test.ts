import { gzipSync } from 'node:zlib';

import { expect, type Page, test } from '@playwright/test';

const transcript = [
  '{"type":"user","sessionId":"theme-session","cwd":"/workspace","version":"2.1.0","message":{"role":"user","content":"Theme me"}}',
  '{"type":"assistant","sessionId":"theme-session","message":{"role":"assistant","content":[{"type":"text","text":"Themed"}]}}',
].join('\n');
const link = `/viewer.html#v=1&data=${gzipSync(transcript).toString('base64url')}`;

const backgrounds = {
  paper: 'rgb(251, 247, 239)',
  cool: 'rgb(244, 247, 251)',
  dark: 'rgb(17, 24, 39)',
};

function selector(page: Page) {
  return page.getByLabel('Theme');
}

function background(page: Page) {
  return page.locator('telelux-transcript').evaluate((element) => getComputedStyle(element).backgroundColor);
}

function storage(page: Page) {
  return page.evaluate(() => Object.fromEntries(Object.entries(window.localStorage)));
}

test.describe('the theme selector', () => {
  test('starts on paper with nothing stored', async ({ page }) => {
    await page.goto(link);
    await expect(selector(page)).toHaveValue('paper');
    await expect(page.locator('telelux-transcript')).toHaveAttribute('theme', 'light');
    expect(await background(page)).toBe(backgrounds.paper);
    expect(await storage(page)).toEqual({});
  });

  for (const theme of ['cool', 'dark'] as const) {
    test(`switches to ${theme} at once and keeps it across a reload`, async ({ page }) => {
      await page.goto(link);
      await selector(page).selectOption(theme);
      await expect(page.locator('telelux-transcript')).toHaveAttribute('theme', theme === 'dark' ? 'dark' : 'light');
      expect(await background(page)).toBe(backgrounds[theme]);
      expect(await storage(page)).toEqual({ 'telelux-theme': theme });
      await page.reload();
      await expect(selector(page)).toHaveValue(theme);
      await expect(page.locator('telelux-transcript')).toContainText('Theme me');
      expect(await background(page)).toBe(backgrounds[theme]);
    });
  }

  test('paints the page behind the transcript in the dark theme', async ({ page }) => {
    await page.goto(link);
    await selector(page).selectOption('dark');
    const shell = page.locator('.theme-shell');
    await expect(shell).toHaveCSS('background-color', backgrounds.dark);
    await expect(shell).toHaveCSS('color-scheme', 'dark');
  });

  for (const stored of ['', 'sepia', 'DARK']) {
    test(`falls back to paper for the stored value ${JSON.stringify(stored)}`, async ({ page }) => {
      await page.addInitScript((value) => window.localStorage.setItem('telelux-theme', value), stored);
      await page.goto(link);
      await expect(selector(page)).toHaveValue('paper');
      await expect(page.locator('telelux-transcript')).toContainText('Theme me');
    });
  }

  test('keeps working in memory when storage throws', async ({ page }) => {
    await page.addInitScript(() => {
      const deny = () => {
        throw new DOMException('denied', 'SecurityError');
      };
      Storage.prototype.getItem = deny;
      Storage.prototype.setItem = deny;
    });
    await page.goto(link);
    await expect(page.locator('telelux-transcript')).toContainText('Theme me');
    await expect(selector(page)).toHaveValue('paper');
    await selector(page).selectOption('dark');
    await expect(page.locator('telelux-transcript')).toHaveAttribute('theme', 'dark');
    expect(await background(page)).toBe(backgrounds.dark);
  });

  test('switches without a request, a reload, or a re-parse of the transcript', async ({ page }) => {
    await page.goto(link);
    await page.getByRole('button', { name: /^Metadata \(/ }).click();
    await expect(page.getByRole('dialog', { name: 'Transcript Metadata' })).toBeVisible();
    await page.evaluate(() => Object.assign(document.querySelector('telelux-transcript')!, { marker: true }));
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    for (const theme of ['cool', 'dark', 'paper']) {
      await selector(page).selectOption(theme);
      await expect(page.locator('.theme-shell')).toHaveAttribute('data-theme', theme);
    }
    expect(requests).toEqual([]);
    await expect(page.getByRole('dialog', { name: 'Transcript Metadata' })).toBeVisible();
    expect(await page.locator('telelux-transcript').evaluate((element) => 'marker' in element)).toBe(true);
    expect(JSON.stringify(await storage(page))).not.toContain('Theme me');
  });
});
