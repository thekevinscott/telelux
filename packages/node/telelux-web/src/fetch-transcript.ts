import { fetchBytes, type FetchOptions } from './fetch-bytes';

export type FetchResult = { ok: true; text: string } | { ok: false; error: string };

export async function fetchTranscript(url: string, options: FetchOptions): Promise<FetchResult> {
  const fetched = await fetchBytes(url, options);
  if (!fetched.ok) {
    return fetched;
  }
  try {
    return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(fetched.bytes) };
  } catch {
    return { ok: false, error: `The transcript at ${url} is not valid UTF-8 text.` };
  }
}
