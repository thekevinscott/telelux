import { describe, expect, it } from 'vitest';

import { gunzipCapped } from './gunzip-capped';

async function gzip(input: string | Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const compressed = new Response(bytes).body?.pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(compressed).arrayBuffer());
}

describe('gunzipCapped', () => {
  it('decompresses gzip bytes', async () => {
    const result = await gunzipCapped(await gzip('hello'), 100);
    expect(result.ok && new TextDecoder().decode(result.bytes)).toBe('hello');
  });

  it('joins output that arrives in several chunks, in order', async () => {
    const text = Array.from({ length: 200_000 }, (_, i) => String(i % 97)).join(',');
    const result = await gunzipCapped(await gzip(text), 10 * 1024 * 1024);
    expect(result.ok && new TextDecoder().decode(result.bytes)).toBe(text);
  });

  it('accepts output exactly at the limit', async () => {
    const result = await gunzipCapped(await gzip('x'.repeat(64)), 64);
    expect(result.ok && result.bytes.length).toBe(64);
  });

  it('stops once output passes the limit', async () => {
    expect(await gunzipCapped(await gzip('x'.repeat(65)), 64)).toStrictEqual({ ok: false, reason: 'too-large' });
  });

  it('stops a decompression bomb without inflating all of it', async () => {
    const bomb = await gzip(new Uint8Array(64 * 1024 * 1024));
    expect(await gunzipCapped(bomb, 1024)).toStrictEqual({ ok: false, reason: 'too-large' });
  });

  it('reports bytes that are not gzip', async () => {
    expect(await gunzipCapped(new TextEncoder().encode('plain text'), 100)).toStrictEqual({ ok: false, reason: 'invalid' });
  });

  it('reports a truncated gzip stream', async () => {
    const whole = await gzip('hello world');
    expect(await gunzipCapped(whole.subarray(0, whole.length - 6), 100)).toStrictEqual({ ok: false, reason: 'invalid' });
  });
});
