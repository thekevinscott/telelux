import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { expect, type Page, test } from '@playwright/test';

const dist = fileURLToPath(new URL('../../dist/', import.meta.url));

function record(content: string): string {
  return JSON.stringify({ type: 'user', message: { role: 'user', content } });
}

function linkTo(text: string): string {
  return `#v=1&data=${gzipSync(text).toString('base64url')}`;
}

function sidecar(label: string, note: string) {
  return {
    version: 1,
    annotations: [{ id: 'a1', target: { start: { index: 1 } }, label, note, source: { kind: 'judge', name: 'rubric-v2' } }],
  };
}

function json(name: string, content: string) {
  return { name, mimeType: 'application/json', buffer: Buffer.from(content) };
}

function escape(text: string): string {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

const transcript = [record('First question'), record('Second question')].join('\n');

async function openTranscript(page: Page) {
  await page.goto(`/viewer.html${linkTo(transcript)}`);
  await expect(page.locator('telelux-transcript ol > li')).toHaveCount(2);
}

async function pick(page: Page, file: ReturnType<typeof json>) {
  await page.getByRole('button', { name: 'Open an annotations file' }).click();
  await page.locator('.annotations-file input[type="file"]').setInputFiles(file);
}

test.describe('loading annotations', () => {
  test('ships an empty annotations slot in the built viewer', () => {
    const html = readFileSync(`${dist}viewer.html`, 'utf8');
    expect(html).toContain('<script type="application/json" id="annotations"></script>');
  });

  test('offers no annotations picker until a transcript is shown', async ({ page }) => {
    await page.goto('/viewer.html');
    await expect(page.getByText('No transcript loaded.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open an annotations file' })).toHaveCount(0);
  });

  test('renders a picked sidecar on the transcript already open', async ({ page }) => {
    await openTranscript(page);
    await pick(page, json('review.json', JSON.stringify(sidecar('unverified-claim', 'Never checked.'))));
    const card = page.locator('telelux-transcript ol > li').nth(1).getByRole('article', { name: 'Annotation unverified-claim' });
    await expect(card).toContainText('Never checked.');
    await expect(card).toContainText('judge: rubric-v2');
    await expect(page.getByText('Annotations (1)')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('replaces the sidecar when another is picked', async ({ page }) => {
    await openTranscript(page);
    await pick(page, json('one.json', JSON.stringify(sidecar('first-label', 'One.'))));
    await expect(page.locator('telelux-transcript telelux-annotation')).toContainText('first-label');
    await pick(page, json('two.json', JSON.stringify(sidecar('second-label', 'Two.'))));
    await expect(page.locator('telelux-transcript telelux-annotation')).toHaveCount(1);
    await expect(page.locator('telelux-transcript telelux-annotation')).toContainText('second-label');
  });

  test('says a file is not JSON and keeps the annotations already shown', async ({ page }) => {
    await openTranscript(page);
    await pick(page, json('good.json', JSON.stringify(sidecar('kept', 'Still here.'))));
    await pick(page, json('broken.json', '{"version": 1,'));
    await expect(page.getByRole('alert')).toContainText('broken.json is not valid JSON:');
    await expect(page.locator('telelux-transcript telelux-annotation')).toContainText('kept');
  });

  test('lists the schema reasons when the JSON is not an annotations sidecar', async ({ page }) => {
    await openTranscript(page);
    await pick(page, json('wrong.json', JSON.stringify({ version: 2, annotations: [] })));
    await expect(page.getByRole('alert')).toContainText('wrong.json is not an annotations file:');
    await expect(page.getByRole('alert')).toContainText('version');
    await expect(page.locator('telelux-transcript telelux-annotation')).toHaveCount(0);
  });

  test('drops the sidecar when another transcript is opened', async ({ page }) => {
    await openTranscript(page);
    await pick(page, json('review.json', JSON.stringify(sidecar('gone-soon', 'Bye.'))));
    await expect(page.locator('telelux-transcript telelux-annotation')).toHaveCount(1);
    await page.evaluate((hash) => {
      window.location.hash = hash;
    }, linkTo(record('A different transcript')));
    await expect(page.locator('telelux-transcript')).toContainText('A different transcript');
    await expect(page.locator('telelux-transcript telelux-annotation')).toHaveCount(0);
  });

  test('stores nothing in the browser', async ({ page }) => {
    await openTranscript(page);
    await pick(page, json('review.json', JSON.stringify(sidecar('private', 'Secret note.'))));
    await expect(page.locator('telelux-transcript telelux-annotation')).toHaveCount(1);
    const stored = await page.evaluate(() => [Object.keys(localStorage), Object.keys(sessionStorage)]);
    expect(stored).toEqual([[], []]);
    expect(page.url()).not.toContain('private');
  });

  test('renders annotations baked into a page with its transcript, and ignores them under a fragment', async ({ page }) => {
    const notes = sidecar('baked-label', 'Baked </script><!-- & note');
    const html = readFileSync(`${dist}viewer.html`, 'utf8')
      .replace('id="transcript"></script>', `id="transcript">${escape(transcript)}</script>`)
      .replace('id="annotations"></script>', `id="annotations">${escape(JSON.stringify(notes))}</script>`);
    const path = join(mkdtempSync(join(tmpdir(), 'telelux-')), 'baked.html');
    writeFileSync(path, html);
    await page.goto(`file://${path}`);
    const card = page.locator('telelux-transcript ol > li').nth(1).getByRole('article', { name: 'Annotation baked-label' });
    await expect(card).toContainText('Baked </script><!-- & note');
    await page.goto(`file://${path}${linkTo(transcript)}`);
    await expect(page.locator('telelux-transcript ol > li')).toHaveCount(2);
    await expect(page.locator('telelux-transcript telelux-annotation')).toHaveCount(0);
  });

  test('reports baked-in annotations it cannot read and still renders the transcript', async ({ page }) => {
    const html = readFileSync(`${dist}viewer.html`, 'utf8')
      .replace('id="transcript"></script>', `id="transcript">${escape(transcript)}</script>`)
      .replace('id="annotations"></script>', 'id="annotations">not json</script>');
    const path = join(mkdtempSync(join(tmpdir(), 'telelux-')), 'broken.html');
    writeFileSync(path, html);
    await page.goto(`file://${path}`);
    await expect(page.getByRole('alert')).toContainText('The baked-in annotations slot is not valid JSON:');
    await expect(page.locator('telelux-transcript ol > li')).toHaveCount(2);
  });
});
