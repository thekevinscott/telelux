import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decodePayload } from './decode-payload';
import { fetchTranscript } from './fetch-transcript';
import { type LoadContext, loadFragment } from './load-fragment';
import { parseFragment } from './parse-fragment';
import { readBakedSlot } from './read-baked-slot';

vi.mock('./parse-fragment', async () => {
  const actual = await vi.importActual<typeof import('./parse-fragment')>('./parse-fragment');
  const parseFragment: typeof actual.parseFragment = (hash) => {
    switch (hash) {
      case '':
        return { kind: 'none' };
      case '#junk':
        return { kind: 'malformed' };
      case '#v=7':
        return { kind: 'unsupported-version', version: '7' };
      default:
        return hash.startsWith('#https://') ? { kind: 'url', url: hash.slice(1) } : { kind: 'payload', data: hash.slice(1) };
    }
  };
  return { ...actual, parseFragment: vi.fn(parseFragment) };
});

vi.mock('./decode-payload', async () => {
  const actual = await vi.importActual<typeof import('./decode-payload')>('./decode-payload');
  const decodePayload: typeof actual.decodePayload = async (data) =>
    data === 'bad' ? { ok: false, error: 'Decoding failed.' } : { ok: true, text: `text:${data}` };
  return { ...actual, decodePayload: vi.fn(decodePayload) };
});

vi.mock('./fetch-transcript', async () => {
  const actual = await vi.importActual<typeof import('./fetch-transcript')>('./fetch-transcript');
  const fetchTranscript: typeof actual.fetchTranscript = async (url, { onProgress }) => {
    onProgress(5, 10);
    return url.endsWith('/missing') ? { ok: false, error: 'HTTP 404.' } : { ok: true, text: `body:${url}` };
  };
  return { ...actual, fetchTranscript: vi.fn(fetchTranscript) };
});

vi.mock('./read-baked-slot', async () => {
  const actual = await vi.importActual<typeof import('./read-baked-slot')>('./read-baked-slot');
  return { ...actual, readBakedSlot: vi.fn<typeof actual.readBakedSlot>() };
});

function bake(slots: Record<string, string>) {
  vi.mocked(readBakedSlot).mockImplementation((_page, id) => slots[id]);
}

let context: LoadContext;

beforeEach(() => {
  context = { signal: new AbortController().signal, cache: new Map(), onProgress: vi.fn() };
  vi.mocked(fetchTranscript).mockClear();
  vi.mocked(decodePayload).mockClear();
  vi.mocked(readBakedSlot).mockReset();
});

describe('loadFragment', () => {
  it('reads the hash it is given', async () => {
    await loadFragment('#abc', context);
    expect(parseFragment).toHaveBeenLastCalledWith('#abc');
  });

  it('is empty when there is no fragment and no baked-in transcript', async () => {
    bake({ annotations: '{}' });
    expect(await loadFragment('', context)).toStrictEqual({ kind: 'empty' });
    expect(readBakedSlot).toHaveBeenCalledWith(document, 'transcript');
  });

  it('shows the baked-in transcript when there is no fragment', async () => {
    bake({ transcript: 'baked' });
    expect(await loadFragment('', context)).toStrictEqual({ kind: 'transcript', text: 'baked', annotations: undefined });
  });

  it('carries the baked-in annotations along with the baked-in transcript', async () => {
    bake({ transcript: 'baked', annotations: '{"version":1}' });
    expect(await loadFragment('', context)).toStrictEqual({ kind: 'transcript', text: 'baked', annotations: '{"version":1}' });
    expect(readBakedSlot).toHaveBeenCalledWith(document, 'annotations');
  });

  it('lets a fragment take precedence over the baked-in transcript and its annotations', async () => {
    bake({ transcript: 'baked', annotations: '{"version":1}' });
    expect(await loadFragment('#abc', context)).toStrictEqual({ kind: 'transcript', text: 'text:abc' });
    expect(readBakedSlot).not.toHaveBeenCalled();
  });

  it('turns a payload into transcript text without a loading state', async () => {
    expect(await loadFragment('#abc', context)).toStrictEqual({ kind: 'transcript', text: 'text:abc' });
    expect(decodePayload).toHaveBeenLastCalledWith('abc');
    expect(context.onProgress).not.toHaveBeenCalled();
  });

  it('surfaces the decoding error for a bad payload, with no retry', async () => {
    expect(await loadFragment('#bad', context)).toStrictEqual({ kind: 'error', message: 'Decoding failed.', retry: false });
  });

  it('explains a fragment that is not an envelope', async () => {
    expect(await loadFragment('#junk', context)).toStrictEqual({
      kind: 'error',
      message: 'This link is not a transcript link. Transcript links end in #v=1&data=…',
      retry: false,
    });
  });

  it('names the version it cannot read', async () => {
    expect(await loadFragment('#v=7', context)).toStrictEqual({
      kind: 'error',
      message: 'This link uses format version "7", which this viewer cannot read. It reads version 1.',
      retry: false,
    });
  });

  it('fetches a hosted URL, reporting progress as loading states', async () => {
    const url = 'https://example.com/t.jsonl';
    expect(await loadFragment(`#${url}`, context)).toStrictEqual({ kind: 'transcript', text: `body:${url}` });
    expect(fetchTranscript).toHaveBeenLastCalledWith(url, expect.objectContaining({ signal: context.signal }));
    expect(vi.mocked(context.onProgress).mock.calls).toStrictEqual([
      [{ kind: 'loading', url, received: 0, total: undefined }],
      [{ kind: 'loading', url, received: 5, total: 10 }],
    ]);
    expect(decodePayload).not.toHaveBeenCalled();
  });

  it('serves a URL it already fetched from the cache, without another request', async () => {
    const url = 'https://example.com/t.jsonl';
    await loadFragment(`#${url}`, context);
    expect(await loadFragment(`#${url}`, { ...context, onProgress: vi.fn() })).toStrictEqual({ kind: 'transcript', text: `body:${url}` });
    expect(fetchTranscript).toHaveBeenCalledTimes(1);
  });

  it('offers a retry for a failed fetch and does not cache it', async () => {
    const url = 'https://example.com/missing';
    expect(await loadFragment(`#${url}`, context)).toStrictEqual({ kind: 'error', message: 'HTTP 404.', retry: true });
    expect(context.cache.has(url)).toBe(false);
  });
});
