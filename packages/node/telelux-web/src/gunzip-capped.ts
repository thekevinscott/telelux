import { readCapped } from './read-capped';

export type GunzipResult = { ok: true; bytes: Uint8Array } | { ok: false; reason: 'invalid' | 'too-large' };

export async function gunzipCapped(bytes: Uint8Array<ArrayBuffer>, limit: number): Promise<GunzipResult> {
  const stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  }).pipeThrough(new DecompressionStream('gzip'));
  try {
    const read = await readCapped(stream, limit);
    return read.ok ? read : { ok: false, reason: 'too-large' };
  } catch {
    return { ok: false, reason: 'invalid' };
  }
}
