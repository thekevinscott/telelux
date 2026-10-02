import { describe, expect, it, vi } from 'vitest';

import { decodePayload } from './decode-payload';
import { loadFragment } from './load-fragment';
import { parseFragment } from './parse-fragment';

vi.mock('./parse-fragment', () => ({
  parseFragment: vi.fn((hash: string) => {
    switch (hash) {
      case '':
        return { kind: 'none' };
      case '#junk':
        return { kind: 'malformed' };
      case '#v=7':
        return { kind: 'unsupported-version', version: '7' };
      case '#url':
        return { kind: 'url', url: 'https://example.com/t.jsonl' };
      default:
        return { kind: 'payload', data: hash.slice(1) };
    }
  }),
}));

vi.mock('./decode-payload', () => ({
  decodePayload: vi.fn(async (data: string) => (data === 'bad' ? { ok: false, error: 'Decoding failed.' } : { ok: true, text: `text:${data}` })),
}));

describe('loadFragment', () => {
  it('reads the hash it is given', async () => {
    await loadFragment('#abc');
    expect(parseFragment).toHaveBeenLastCalledWith('#abc');
  });

  it('is empty when there is no fragment', async () => {
    expect(await loadFragment('')).toStrictEqual({ kind: 'empty' });
  });

  it('turns a payload into transcript text', async () => {
    expect(await loadFragment('#abc')).toStrictEqual({ kind: 'transcript', text: 'text:abc' });
    expect(decodePayload).toHaveBeenLastCalledWith('abc');
  });

  it('surfaces the decoding error for a bad payload', async () => {
    expect(await loadFragment('#bad')).toStrictEqual({ kind: 'error', message: 'Decoding failed.' });
  });

  it('explains a fragment that is not an envelope', async () => {
    expect(await loadFragment('#junk')).toStrictEqual({
      kind: 'error',
      message: 'This link is not a transcript link. Transcript links end in #v=1&data=…',
    });
  });

  it('names the version it cannot read', async () => {
    expect(await loadFragment('#v=7')).toStrictEqual({
      kind: 'error',
      message: 'This link uses format version "7", which this viewer cannot read. It reads version 1.',
    });
  });

  it('does not decode a hosted URL as a payload', async () => {
    vi.mocked(decodePayload).mockClear();
    expect(await loadFragment('#url')).toStrictEqual({ kind: 'error', message: 'This viewer cannot open hosted transcript links yet.' });
    expect(decodePayload).not.toHaveBeenCalled();
  });
});
