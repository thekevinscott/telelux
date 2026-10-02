import { readCapped } from './read-capped';

export type FetchOptions = {
  signal: AbortSignal;
  onProgress: (received: number, total: number | undefined) => void;
};

function mib(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export type FetchBytesResult = { ok: true; bytes: Uint8Array } | { ok: false; error: string };

export async function fetchBytes(url: string, { signal, onProgress }: FetchOptions): Promise<FetchBytesResult> {
  const limit = 50 * 1024 * 1024;
  const deadline = AbortSignal.timeout(30_000);
  try {
    const response = await fetch(url, {
      signal: AbortSignal.any([signal, deadline]),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    if (!response.ok) {
      return { ok: false, error: `The server answered HTTP ${`${response.status} ${response.statusText}`.trim()} for ${url}.` };
    }
    const header = response.headers.get('content-length');
    const total = header === null ? undefined : Number(header);
    if (total !== undefined && total > limit) {
      return { ok: false, error: `The transcript at ${url} is ${mib(total)} MiB; the limit is ${mib(limit)} MiB.` };
    }
    if (response.body === null) {
      return { ok: true, bytes: new Uint8Array() };
    }
    const read = await readCapped(response.body, limit, (received) => onProgress(received, total));
    if (!read.ok) {
      return { ok: false, error: `The transcript at ${url} is more than ${mib(limit)} MiB; the limit is ${mib(limit)} MiB.` };
    }
    return read;
  } catch {
    if (signal.aborted) {
      return { ok: false, error: 'Loading was cancelled.' };
    }
    if (deadline.aborted) {
      return { ok: false, error: `${url} did not finish loading within 30 seconds.` };
    }
    return {
      ok: false,
      error: `Could not load ${url}. The server may be unreachable, or it may not allow this page to read it (CORS).`,
    };
  }
}
