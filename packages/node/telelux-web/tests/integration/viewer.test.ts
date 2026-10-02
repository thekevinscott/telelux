import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { expect, test } from '@playwright/test';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));

const transcript = '{"type":"user","message":{"role":"user","content":"Hello from a link"}}';
const link = `#v=1&data=${gzipSync(transcript).toString('base64url')}`;

test.describe('the built viewer', () => {
  test('is one HTML file with every script and style inlined', () => {
    expect(readdirSync(dist)).toEqual(['viewer.html']);
    const html = readFileSync(`${dist}viewer.html`, 'utf8');
    expect(html).not.toMatch(/<script[^>]*\ssrc=/);
    expect(html).not.toMatch(/<link[^>]*\shref=/);
    expect(html).toMatch(/<script type="module"[^>]*>[\s\S]+customElements\.define/);
  });

  test('says no transcript is loaded when opened without a fragment', async ({ page }) => {
    await page.goto('/viewer.html');
    await expect(page.getByText('No transcript loaded.')).toBeVisible();
    await expect(page.locator('telelux-transcript')).toHaveCount(0);
  });

  test('renders a compressed link through telelux-transcript', async ({ page }) => {
    await page.goto(`/viewer.html${link}`);
    const block = page.locator('telelux-transcript ol > li').first();
    await expect(block).toContainText('Hello from a link');
    await expect(block).toContainText('User');
  });

  test('loads a new link when the fragment changes, and Back restores the old one', async ({ page }) => {
    await page.goto(`/viewer.html${link}`);
    await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
    const other = '{"type":"user","message":{"role":"user","content":"A second transcript"}}';
    await page.evaluate((hash) => (window.location.hash = hash), `#v=1&data=${gzipSync(other).toString('base64url')}`);
    await expect(page.locator('telelux-transcript')).toContainText('A second transcript');
    await page.goBack();
    await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
  });

  test('shows a decoding error for a corrupted link', async ({ page }) => {
    await page.goto(`/viewer.html${link.slice(0, -8)}`);
    await expect(page.getByRole('alert')).toContainText('not valid gzip');
  });

  test('shows a compatibility error for an unknown version', async ({ page }) => {
    await page.goto('/viewer.html#v=2&data=abc');
    await expect(page.getByRole('alert')).toContainText('format version "2"');
  });

  test('renders a compressed link opened straight from disk with no network', async ({ page }) => {
    const requests: string[] = [];
    await page.route('**/*', (route) => {
      requests.push(route.request().url());
      return route.request().url().startsWith('file:') ? route.continue() : route.abort();
    });
    await page.goto(`file://${dist}viewer.html${link}`);
    await expect(page.locator('telelux-transcript ol > li').first()).toContainText('Hello from a link');
    expect(requests.filter((url) => !url.startsWith('file:'))).toEqual([]);
  });
});
