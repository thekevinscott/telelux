import { gzipSync } from 'node:zlib';

import { describe, expect, it } from 'vitest';

import { gunzipCapped } from './gunzip-capped';

describe('gunzipCapped', () => {
  it('decompresses gzip bytes', async () => {
    const result = await gunzipCapped(gzipSync('hello'), 100);
    expect(result.ok && new TextDecoder().decode(result.bytes)).toBe('hello');
  });

  it('joins output that arrives in several chunks, in order', async () => {
    const text = Array.from({ length: 200_000 }, (_, i) => String(i % 97)).join(',');
    const result = await gunzipCapped(gzipSync(text), 10 * 1024 * 1024);
    expect(result.ok && new TextDecoder().decode(result.bytes)).toBe(text);
  });

  it('accepts output exactly at the limit', async () => {
    const result = await gunzipCapped(gzipSync('x'.repeat(64)), 64);
    expect(result.ok && result.bytes.length).toBe(64);
  });

  it('stops once output passes the limit', async () => {
    expect(await gunzipCapped(gzipSync('x'.repeat(65)), 64)).toStrictEqual({ ok: false, reason: 'too-large' });
  });

  it('stops a decompression bomb without inflating all of it', async () => {
    const bomb = gzipSync(Buffer.alloc(256 * 1024 * 1024));
    expect(await gunzipCapped(bomb, 1024)).toStrictEqual({ ok: false, reason: 'too-large' });
  });

  it('reports bytes that are not gzip', async () => {
    expect(await gunzipCapped(new TextEncoder().encode('plain text'), 100)).toStrictEqual({ ok: false, reason: 'invalid' });
  });

  it('reports a truncated gzip stream', async () => {
    const whole = gzipSync('hello world');
    expect(await gunzipCapped(whole.subarray(0, whole.length - 6), 100)).toStrictEqual({ ok: false, reason: 'invalid' });
  });
});
