import { parseRawTranscript } from 'telelux-element/parse';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encodeBase64url } from './encode-base64url';
import { gzip } from './gzip';
import { prepareLocalFile } from './prepare-local-file';

vi.mock('./gzip', async () => {
  const actual = await vi.importActual<typeof import('./gzip')>('./gzip');
  const gzip: typeof actual.gzip = async (bytes) => bytes.slice(0, Math.ceil(bytes.length / 2));
  return { ...actual, gzip: vi.fn(gzip) };
});

vi.mock('./encode-base64url', async () => {
  const actual = await vi.importActual<typeof import('./encode-base64url')>('./encode-base64url');
  const encodeBase64url: typeof actual.encodeBase64url = (bytes) => 'p'.repeat(bytes.length);
  return { ...actual, encodeBase64url: vi.fn(encodeBase64url) };
});

vi.mock('telelux-element/parse', async () => {
  const actual = await vi.importActual<typeof import('telelux-element/parse')>('telelux-element/parse');
  const parseRawTranscript: typeof actual.parseRawTranscript = (text) =>
    text.startsWith('bad')
      ? { ok: false, error: 'The transcript has 100001 records; the limit is 100000.' }
      : { ok: true, transcript: { id: 't', messages: [], metadata: {} } };
  return { ...actual, parseRawTranscript: vi.fn(parseRawTranscript) };
});

const base = 'https://example.com/viewer.html';
const linkRoom = 8000 - base.length - '#v=1&data='.length;

function file(content: BlobPart, name = 'session.jsonl'): File {
  return new File([content], name);
}

function sized(size: number, name = 'big.jsonl'): File {
  const big = new File([], name);
  Object.defineProperty(big, 'size', { value: size });
  big.arrayBuffer = vi.fn(async () => new ArrayBuffer(0));
  return big;
}

beforeEach(() => {
  vi.mocked(gzip).mockClear();
  vi.mocked(parseRawTranscript).mockClear();
});

describe('prepareLocalFile', () => {
  it('ignores an empty selection', async () => {
    expect(await prepareLocalFile([], base)).toStrictEqual({ kind: 'none' });
  });

  it('turns a small file into a #v=1&data= link of its gzipped, base64url bytes', async () => {
    expect(await prepareLocalFile([file('{"a":1}')], base)).toStrictEqual({ kind: 'link', hash: '#v=1&data=pppp' });
    expect(Array.from(vi.mocked(gzip).mock.calls[0][0])).toStrictEqual(Array.from(new TextEncoder().encode('{"a":1}')));
    expect(encodeBase64url).toHaveBeenCalledTimes(1);
    expect(parseRawTranscript).toHaveBeenCalledWith('{"a":1}');
  });

  it('accepts a link exactly at 8,000 characters, counting the page address', async () => {
    const result = await prepareLocalFile([file('x'.repeat(linkRoom * 2))], base);
    expect(result).toMatchObject({ kind: 'link' });
    expect(base.length + (result.kind === 'link' ? result.hash.length : 0)).toBe(8000);
  });

  it('offers a download when the link would run past 8,000 characters', async () => {
    const text = 'x'.repeat(linkRoom * 2 + 1);
    expect(await prepareLocalFile([file(text, 'long.jsonl')], base)).toStrictEqual({
      kind: 'too-large',
      name: 'long.jsonl',
      text,
      message: 'long.jsonl is too large for a shareable link: it needs 8001 characters, and links are capped at 8,000.',
    });
  });

  it('offers a download without compressing a file past the 10 MiB link limit', async () => {
    const text = 'x'.repeat(10 * 1024 * 1024 + 1);
    expect(await prepareLocalFile([file(text, 'huge.jsonl')], base)).toStrictEqual({
      kind: 'too-large',
      name: 'huge.jsonl',
      text,
      message: 'huge.jsonl is too large for a shareable link: it is 10.0 MiB, and links hold at most 10 MiB.',
    });
    expect(gzip).not.toHaveBeenCalled();
  });

  it('compresses a file exactly at the 10 MiB link limit', async () => {
    await prepareLocalFile([file('x'.repeat(10 * 1024 * 1024))], base);
    expect(gzip).toHaveBeenCalledTimes(1);
  });

  it('refuses a file past the 50 MiB limit without reading it', async () => {
    const big = sized(50 * 1024 * 1024 + 1);
    expect(await prepareLocalFile([big], base)).toStrictEqual({
      kind: 'error',
      message: 'big.jsonl is 50.0 MiB; the limit is 50 MiB.',
    });
    expect(big.arrayBuffer).not.toHaveBeenCalled();
  });

  it('reads a file exactly at the 50 MiB limit', async () => {
    const big = sized(50 * 1024 * 1024);
    await prepareLocalFile([big], base);
    expect(big.arrayBuffer).toHaveBeenCalledTimes(1);
  });

  it('refuses more than one file', async () => {
    expect(await prepareLocalFile([file('a'), file('b')], base)).toStrictEqual({
      kind: 'error',
      message: 'Open one transcript file at a time; 2 were given.',
    });
  });

  it('explains a file the browser cannot read, such as a folder', async () => {
    const folder = file('', 'logs');
    folder.arrayBuffer = () => Promise.reject(new DOMException('NotReadableError'));
    expect(await prepareLocalFile([folder], base)).toStrictEqual({
      kind: 'error',
      message: 'Could not read logs. Open a single transcript file, not a folder.',
    });
  });

  it('refuses text that is not valid UTF-8', async () => {
    expect(await prepareLocalFile([file(new Uint8Array([0xff, 0xfe]), 'binary.bin')], base)).toStrictEqual({
      kind: 'error',
      message: 'binary.bin is not valid UTF-8 text.',
    });
  });

  it('refuses a transcript the parser rejects, with the parser\'s reason', async () => {
    expect(await prepareLocalFile([file('bad records')], base)).toStrictEqual({
      kind: 'error',
      message: 'Cannot open session.jsonl. The transcript has 100001 records; the limit is 100000.',
    });
    expect(gzip).not.toHaveBeenCalled();
  });
});
