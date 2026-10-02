export type ReadResult = { ok: true; bytes: Uint8Array<ArrayBuffer> } | { ok: false };

export async function readCapped(
  stream: ReadableStream<Uint8Array>,
  limit: number,
  onProgress: (received: number) => void = () => {},
): Promise<ReadResult> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (let next = await reader.read(); !next.done; next = await reader.read()) {
    total += next.value.length;
    if (total > limit) {
      await reader.cancel();
      return { ok: false };
    }
    chunks.push(next.value);
    onProgress(total);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return { ok: true, bytes };
}
