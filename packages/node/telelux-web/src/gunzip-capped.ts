export type GunzipResult = { ok: true; bytes: Uint8Array } | { ok: false; reason: 'invalid' | 'too-large' };

export async function gunzipCapped(bytes: Uint8Array<ArrayBuffer>, limit: number): Promise<GunzipResult> {
  const reader = new ReadableStream<Uint8Array<ArrayBuffer>>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  })
    .pipeThrough(new DecompressionStream('gzip'))
    .getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (let next = await reader.read(); !next.done; next = await reader.read()) {
      total += next.value.length;
      if (total > limit) {
        await reader.cancel();
        return { ok: false, reason: 'too-large' };
      }
      chunks.push(next.value);
    }
  } catch {
    return { ok: false, reason: 'invalid' };
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return { ok: true, bytes: out };
}
