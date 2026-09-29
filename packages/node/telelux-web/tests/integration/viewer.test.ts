import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));

test.describe('the built viewer', () => {
  test('is one HTML file with every script and style inlined', () => {
    expect(readdirSync(dist)).toEqual(['viewer.html']);
    const html = readFileSync(`${dist}viewer.html`, 'utf8');
    expect(html).not.toMatch(/<script[^>]*\ssrc=/);
    expect(html).not.toMatch(/<link[^>]*\shref=/);
    expect(html).toMatch(/<script type="module"[^>]*>[\s\S]+customElements\.define/);
  });

  test('renders the transcript through telelux-transcript when served', async ({ page }) => {
    await page.goto('/viewer.html');
    const block = page.locator('telelux-transcript ol > li').first();
    await expect(block).toContainText('Hello');
    await expect(block).toContainText('User');
  });

  test('renders opened straight from disk with no network', async ({ page }) => {
    const requests: string[] = [];
    await page.route('**/*', (route) => {
      requests.push(route.request().url());
      return route.request().url().startsWith('file:') ? route.continue() : route.abort();
    });
    await page.goto(`file://${dist}viewer.html`);
    await expect(page.locator('telelux-transcript ol > li').first()).toContainText('Hello');
    expect(requests.filter((url) => !url.startsWith('file:'))).toEqual([]);
  });
});
