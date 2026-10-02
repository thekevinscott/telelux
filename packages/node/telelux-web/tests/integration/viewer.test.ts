import { readdirSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
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

  test.describe('with a hosted transcript link', () => {
    const hosted = 'https://transcripts.example/t.jsonl?token=a%2Fb&download=1';
    const body = '{"type":"user","message":{"role":"user","content":"Hello from a host"}}';

    test('fetches the URL verbatim, renders it, and reuses it from memory on Back', async ({ page }) => {
      const fetched: string[] = [];
      await page.route('https://transcripts.example/**', (route) => {
        fetched.push(route.request().url());
        return route.fulfill({ body, headers: { 'access-control-allow-origin': '*' } });
      });
      await page.goto(`/viewer.html#v=1&data=${hosted}`);
      await expect(page.locator('telelux-transcript')).toContainText('Hello from a host');
      await page.evaluate((hash) => (window.location.hash = hash), link);
      await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
      await page.goBack();
      await expect(page.locator('telelux-transcript')).toContainText('Hello from a host');
      expect(fetched).toEqual([hosted]);
    });

    test('names the HTTP status and retries only when asked', async ({ page }) => {
      let attempts = 0;
      await page.route('https://transcripts.example/**', (route) => {
        attempts += 1;
        return attempts === 1
          ? route.fulfill({ status: 503, body: 'down', headers: { 'access-control-allow-origin': '*' } })
          : route.fulfill({ body, headers: { 'access-control-allow-origin': '*' } });
      });
      await page.goto(`/viewer.html#v=1&data=${hosted}`);
      await expect(page.getByRole('alert')).toContainText('HTTP 503');
      expect(attempts).toBe(1);
      await page.getByRole('button', { name: 'Retry' }).click();
      await expect(page.locator('telelux-transcript')).toContainText('Hello from a host');
    });

    test('explains a host that does not allow cross-origin reads', async ({ page }) => {
      const server = createServer((_, response) => response.end(body));
      await new Promise<void>((listening) => server.listen(0, '127.0.0.1', listening));
      try {
        const { port } = server.address() as AddressInfo;
        await page.goto(`/viewer.html#v=1&data=http://127.0.0.1:${port}/t.jsonl`);
        await expect(page.getByRole('alert')).toContainText('CORS');
        await expect(page.getByRole('button', { name: 'Retry' })).toBeVisible();
      } finally {
        server.close();
      }
    });

    test('shows progress while loading and can be cancelled', async ({ page }) => {
      await page.route('https://transcripts.example/**', () => {});
      await page.goto(`/viewer.html#v=1&data=${hosted}`);
      await expect(page.getByRole('status')).toContainText(`Loading ${hosted}`);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('alert')).toContainText('Loading was cancelled.');
    });
  });

  test.describe('with a typed URL', () => {
    const hosted = 'https://transcripts.example/typed.jsonl';
    const body = '{"type":"user","message":{"role":"user","content":"Hello from a typed URL"}}';

    test('opens it as a hosted link, with progress and Cancel', async ({ page }) => {
      await page.route('https://transcripts.example/**', () => {});
      await page.goto('/viewer.html');
      await page.getByRole('textbox', { name: 'Transcript URL' }).fill(hosted);
      await page.getByRole('button', { name: 'Open', exact: true }).click();
      await expect(page).toHaveURL(`/viewer.html#v=1&data=${hosted}`);
      await expect(page.getByRole('status')).toContainText(`Loading ${hosted}`);
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('alert')).toContainText('Loading was cancelled.');
    });

    test('renders the fetched transcript when submitted with Enter', async ({ page }) => {
      await page.route('https://transcripts.example/**', (route) =>
        route.fulfill({ body, headers: { 'access-control-allow-origin': '*' } }),
      );
      await page.goto(`/viewer.html${link}`);
      await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
      await page.getByRole('textbox', { name: 'Transcript URL' }).fill(hosted);
      await page.getByRole('textbox', { name: 'Transcript URL' }).press('Enter');
      await expect(page.locator('telelux-transcript')).toContainText('Hello from a typed URL');
    });

    test('flags a non-http(s) URL inline and does not navigate', async ({ page }) => {
      await page.goto('/viewer.html');
      const box = page.getByRole('textbox', { name: 'Transcript URL' });
      await box.fill('ftp://transcripts.example/t.jsonl');
      await page.getByRole('button', { name: 'Open', exact: true }).click();
      await expect(page.getByRole('alert')).toHaveText('Enter a URL that starts with http:// or https://.');
      await expect(box).toHaveAttribute('aria-invalid', 'true');
      await expect(page).toHaveURL('/viewer.html');
      await expect(page.getByText('No transcript loaded.')).toBeVisible();
    });
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
