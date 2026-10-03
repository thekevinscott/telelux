import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { expect, type Page, test } from '@playwright/test';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));

function record(content: string): string {
  return JSON.stringify({ type: 'user', message: { role: 'user', content } });
}

const small = { name: 'small.jsonl', mimeType: 'application/x-ndjson', buffer: Buffer.from(record('Hello from a file')) };
const bigText = [record('Big hello </script><!-- & done'), record(randomBytes(12_000).toString('hex'))].join('\n');
const big = { name: 'big-session.jsonl', mimeType: 'application/x-ndjson', buffer: Buffer.from(bigText) };
const link = `#v=1&data=${gzipSync(record('Hello from a link')).toString('base64url')}`;

async function drop(page: Page, files: { name: string; text: string }[]) {
  await page.evaluate((dropped) => {
    const data = new DataTransfer();
    for (const { name, text } of dropped) {
      data.items.add(new File([text], name));
    }
    document.body.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }));
  }, files);
}

async function downloadStandalone(page: Page): Promise<{ name: string; path: string }> {
  await page.goto(`/viewer.html${link}`);
  await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
  await page.locator('.local-file input[type="file"]').setInputFiles(big);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download standalone HTML' }).click();
  const download = await downloading;
  const path = join(mkdtempSync(join(tmpdir(), 'telelux-')), download.suggestedFilename());
  await download.saveAs(path);
  return { name: download.suggestedFilename(), path };
}

test.describe('loading a local file', () => {
  test('ships an empty transcript slot in the built viewer', () => {
    const html = readFileSync(`${dist}viewer.html`, 'utf8');
    expect(html).toContain('<script type="application/x-ndjson" id="transcript"></script>');
  });

  test('turns a picked file into a compressed link and renders it', async ({ page }) => {
    await page.goto('/viewer.html');
    await page.getByRole('button', { name: 'Open a transcript file' }).click();
    await page.locator('.local-file input[type="file"]').setInputFiles(small);
    await expect(page.locator('telelux-transcript ol > li').first()).toContainText('Hello from a file');
    expect(new URL(page.url()).hash).toMatch(/^#v=1&data=[A-Za-z0-9_-]+$/);
    await page.reload();
    await expect(page.locator('telelux-transcript')).toContainText('Hello from a file');
  });

  test('renders a file dropped onto the page', async ({ page }) => {
    await page.goto('/viewer.html');
    await drop(page, [{ name: 'dropped.jsonl', text: record('Hello from a drop') }]);
    await expect(page.locator('telelux-transcript')).toContainText('Hello from a drop');
  });

  test('refuses a drop of more than one file', async ({ page }) => {
    await page.goto('/viewer.html');
    await drop(page, [{ name: 'a.jsonl', text: record('a') }, { name: 'b.jsonl', text: record('b') }]);
    await expect(page.getByRole('alert')).toHaveText('Open one transcript file at a time; 2 were given.');
  });

  test('keeps the current transcript when a file is too large for a link, and says so', async ({ page }) => {
    await page.goto(`/viewer.html${link}`);
    await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
    await page.locator('.local-file input[type="file"]').setInputFiles(big);
    await expect(page.getByRole('alert')).toContainText('big-session.jsonl is too large for a shareable link');
    await expect(page.getByRole('alert')).toContainText('links are capped at 8,000');
    await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
    expect(new URL(page.url()).hash).toBe(link);
  });

  test('downloads a standalone HTML file that renders the transcript offline', async ({ page }) => {
    const { name, path } = await downloadStandalone(page);
    expect(name).toBe('big-session.html');
    expect(readFileSync(path, 'utf8')).toContain('Big hello &lt;/script&gt;&lt;!-- &amp; done');
    const requests: string[] = [];
    await page.route('**/*', (route) => {
      requests.push(route.request().url());
      return route.request().url().startsWith('file:') ? route.continue() : route.abort();
    });
    await page.goto(`file://${path}`);
    await expect(page.locator('telelux-transcript ol > li').first()).toContainText('Big hello </script><!-- & done');
    expect(requests.filter((url) => !url.startsWith('file:'))).toEqual([]);
  });

  test('lets a fragment take precedence over the transcript baked into a download', async ({ page }) => {
    const { path } = await downloadStandalone(page);
    await page.goto(`file://${path}${link}`);
    await expect(page.locator('telelux-transcript')).toContainText('Hello from a link');
    await expect(page.locator('telelux-transcript')).not.toContainText('Big hello');
  });
});
