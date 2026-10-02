import { describe, expect, it, vi } from 'vitest';

import { fetchBytes } from './fetch-bytes';
import { fetchTranscript } from './fetch-transcript';

vi.mock('./fetch-bytes', async () => {
  const actual = await vi.importActual<typeof import('./fetch-bytes')>('./fetch-bytes');
  const fetchBytes: typeof actual.fetchBytes = async (url) => {
    if (url.endsWith('/down')) {
      return { ok: false, error: 'Down.' };
    }
    return { ok: true, bytes: url.endsWith('/latin1') ? new Uint8Array([0xff]) : Uint8Array.from(new TextEncoder().encode('Héllo ✓')) };
  };
  return { ...actual, fetchBytes: vi.fn(fetchBytes) };
});

const options = { signal: new AbortController().signal, onProgress: () => {} };

describe('fetchTranscript', () => {
  it('reads the fetched bytes as UTF-8 text', async () => {
    expect(await fetchTranscript('https://a/t', options)).toStrictEqual({ ok: true, text: 'Héllo ✓' });
    expect(fetchBytes).toHaveBeenLastCalledWith('https://a/t', options);
  });

  it('passes a fetch failure through', async () => {
    expect(await fetchTranscript('https://a/down', options)).toStrictEqual({ ok: false, error: 'Down.' });
  });

  it('reports bytes that are not UTF-8', async () => {
    expect(await fetchTranscript('https://a/latin1', options)).toStrictEqual({
      ok: false,
      error: 'The transcript at https://a/latin1 is not valid UTF-8 text.',
    });
  });
});
