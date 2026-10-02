import { describe, expect, it, vi } from 'vitest';

import { readCapped } from './read-capped';

function streamOf(...chunks: number[][]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(new Uint8Array(chunk)));
      controller.close();
    },
  });
}

describe('readCapped', () => {
  it('joins every chunk in order', async () => {
    const result = await readCapped(streamOf([1, 2], [3], [4, 5, 6]), 100);
    expect(result.ok && Array.from(result.bytes)).toStrictEqual([1, 2, 3, 4, 5, 6]);
  });

  it('reads an empty stream to no bytes', async () => {
    const result = await readCapped(streamOf(), 100);
    expect(result.ok && result.bytes.length).toBe(0);
  });

  it('reports the running total after each chunk', async () => {
    const onProgress = vi.fn();
    await readCapped(streamOf([1, 2], [3], [4, 5, 6]), 100, onProgress);
    expect(onProgress.mock.calls).toStrictEqual([[2], [3], [6]]);
  });

  it('accepts a stream exactly at the limit', async () => {
    const result = await readCapped(streamOf([1, 2], [3, 4]), 4);
    expect(result.ok && result.bytes.length).toBe(4);
  });

  it('stops and cancels the stream once it passes the limit', async () => {
    const cancel = vi.fn();
    const pull = vi.fn((controller: ReadableStreamDefaultController<Uint8Array>) => controller.enqueue(new Uint8Array(3)));
    const onProgress = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ pull, cancel }, { highWaterMark: 0 });
    expect(await readCapped(stream, 7, onProgress)).toStrictEqual({ ok: false });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(pull).toHaveBeenCalledTimes(3);
    expect(onProgress.mock.calls).toStrictEqual([[3], [6]]);
  });

  it('lets a stream error propagate', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new TypeError('boom'));
      },
    });
    await expect(readCapped(stream, 100)).rejects.toThrow('boom');
  });
});
