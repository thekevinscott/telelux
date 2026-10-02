import { describe, expect, it } from 'vitest';

import { gzip } from './gzip';

async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const inflated = new Response(bytes).body?.pipeThrough(new DecompressionStream('gzip'));
  return new Response(inflated).text();
}

describe('gzip', () => {
  it('compresses bytes into a gzip stream that inflates back to them', async () => {
    const compressed = await gzip(new TextEncoder().encode('hello hello hello'));
    expect(Array.from(compressed.subarray(0, 2))).toStrictEqual([0x1f, 0x8b]);
    expect(await gunzip(compressed)).toBe('hello hello hello');
  });

  it('compresses repetitive text to far fewer bytes', async () => {
    const text = 'x'.repeat(100_000);
    const compressed = await gzip(new TextEncoder().encode(text));
    expect(compressed.length).toBeLessThan(1000);
    expect(await gunzip(compressed)).toBe(text);
  });
});
