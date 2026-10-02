import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchTranscript } from './fetch-transcript';
import { readCapped } from './read-capped';

vi.mock('./read-capped', async () => {
  const actual = await vi.importActual<typeof import('./read-capped')>('./read-capped');
  const readCapped: typeof actual.readCapped = async (stream, limit, onProgress) => {
    const text = await new Response(stream).text();
    if (text === 'huge') {
      return { ok: false };
    }
    onProgress?.(text.length);
    return { ok: true, bytes: Uint8Array.from(text === 'latin1' ? [0xff] : new TextEncoder().encode(text)) };
  };
  return { ...actual, readCapped: vi.fn(readCapped) };
});

const URL = 'https://example.com/t.jsonl?token=a&b=1';
const fetchMock = vi.fn<typeof fetch>();
let deadline: AbortController;
let user: AbortController;
const onProgress = vi.fn();

function respond(body: string | null, init: ResponseInit = {}) {
  fetchMock.mockResolvedValueOnce(new Response(body, init));
}

beforeEach(() => {
  deadline = new AbortController();
  user = new AbortController();
  vi.spyOn(AbortSignal, 'timeout').mockReturnValue(deadline.signal);
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  onProgress.mockReset();
});

describe('fetchTranscript', () => {
  it('fetches the URL without credentials or a referrer and returns its text', async () => {
    respond('{"type":"user"} ✓', { headers: { 'content-length': '19' } });
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({ ok: true, text: '{"type":"user"} ✓' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(URL);
    expect(init).toMatchObject({ credentials: 'omit', referrerPolicy: 'no-referrer' });
    expect(AbortSignal.timeout).toHaveBeenCalledWith(30_000);
    expect(readCapped).toHaveBeenLastCalledWith(expect.anything(), 50 * 1024 * 1024, expect.any(Function));
    expect(onProgress).toHaveBeenLastCalledWith(17, 19);
  });

  it('reports progress without a total when there is no content-length', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, headers: new Headers(), body: new Response('abc').body } as Response);
    await fetchTranscript(URL, { signal: user.signal, onProgress });
    expect(onProgress).toHaveBeenLastCalledWith(3, undefined);
  });

  it('reads an empty body as empty text', async () => {
    respond(null);
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({ ok: true, text: '' });
  });

  it('aborts the request when either the caller or the 30 second deadline does', async () => {
    respond('');
    await fetchTranscript(URL, { signal: user.signal, onProgress });
    const signal = fetchMock.mock.calls[0][1]?.signal;
    expect(signal?.aborted).toBe(false);
    deadline.abort();
    expect(signal?.aborted).toBe(true);
    respond('');
    await fetchTranscript(URL, { signal: user.signal, onProgress });
    const second = fetchMock.mock.calls[1][1]?.signal;
    user.abort();
    expect(second?.aborted).toBe(true);
  });

  it('names the HTTP status of a failed response', async () => {
    respond('nope', { status: 404, statusText: 'Not Found' });
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({
      ok: false,
      error: `The server answered HTTP 404 Not Found for ${URL}.`,
    });
    respond('nope', { status: 500 });
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({
      ok: false,
      error: `The server answered HTTP 500 for ${URL}.`,
    });
  });

  it('rejects a declared size over 50 MiB before reading the body', async () => {
    vi.mocked(readCapped).mockClear();
    respond('x', { headers: { 'content-length': String(60 * 1024 * 1024) } });
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({
      ok: false,
      error: `The transcript at ${URL} is 60.0 MiB; the limit is 50.0 MiB.`,
    });
    expect(readCapped).not.toHaveBeenCalled();
  });

  it('accepts a declared size of exactly 50 MiB', async () => {
    respond('ok', { headers: { 'content-length': String(50 * 1024 * 1024) } });
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({ ok: true, text: 'ok' });
  });

  it('reports a body that grows past 50 MiB', async () => {
    respond('huge');
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({
      ok: false,
      error: `The transcript at ${URL} is more than 50.0 MiB; the limit is 50.0 MiB.`,
    });
  });

  it('reports a body that is not UTF-8', async () => {
    respond('latin1');
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({
      ok: false,
      error: `The transcript at ${URL} is not valid UTF-8 text.`,
    });
  });

  it('says the load was cancelled when the caller aborted', async () => {
    fetchMock.mockImplementationOnce(async () => {
      user.abort();
      throw new DOMException('aborted', 'AbortError');
    });
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({ ok: false, error: 'Loading was cancelled.' });
  });

  it('says the load timed out when the deadline passed', async () => {
    fetchMock.mockImplementationOnce(async () => {
      deadline.abort();
      throw new DOMException('timed out', 'TimeoutError');
    });
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({
      ok: false,
      error: `${URL} did not finish loading within 30 seconds.`,
    });
  });

  it('explains a network or CORS failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await fetchTranscript(URL, { signal: user.signal, onProgress })).toStrictEqual({
      ok: false,
      error: `Could not load ${URL}. The server may be unreachable, or it may not allow this page to read it (CORS).`,
    });
  });
});
