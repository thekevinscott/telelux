import { describe, expect, it, vi } from 'vitest';

import { decodeBase64url } from './decode-base64url';
import { decodePayload } from './decode-payload';
import { gunzipCapped } from './gunzip-capped';

vi.mock('./decode-base64url', async () => {
  const actual = await vi.importActual<typeof import('./decode-base64url')>('./decode-base64url');
  const decodeBase64url: typeof actual.decodeBase64url = (value) =>
    value === 'bad' ? undefined : Uint8Array.from(new TextEncoder().encode(value));
  return { ...actual, decodeBase64url: vi.fn(decodeBase64url) };
});

vi.mock('./gunzip-capped', async () => {
  const actual = await vi.importActual<typeof import('./gunzip-capped')>('./gunzip-capped');
  const gunzipCapped: typeof actual.gunzipCapped = async (bytes) => {
    const value = new TextDecoder().decode(bytes);
    if (value === 'big') {
      return { ok: false, reason: 'too-large' };
    }
    if (value === 'junk') {
      return { ok: false, reason: 'invalid' };
    }
    if (value === 'latin1') {
      return { ok: true, bytes: new Uint8Array([0xff, 0xfe]) };
    }
    return { ok: true, bytes };
  };
  return { ...actual, gunzipCapped: vi.fn(gunzipCapped) };
});

describe('decodePayload', () => {
  it('decodes, inflates under the 10 MiB cap, and reads the bytes as UTF-8', async () => {
    expect(await decodePayload('Héllo ✓')).toStrictEqual({ ok: true, text: 'Héllo ✓' });
    expect(decodeBase64url).toHaveBeenLastCalledWith('Héllo ✓');
    expect(gunzipCapped).toHaveBeenLastCalledWith(expect.anything(), 10 * 1024 * 1024);
  });

  it('reports data that is not base64url without inflating it', async () => {
    vi.mocked(gunzipCapped).mockClear();
    expect(await decodePayload('bad')).toStrictEqual({
      ok: false,
      error: 'The link data is not valid base64url. The link may have been cut off or altered.',
    });
    expect(gunzipCapped).not.toHaveBeenCalled();
  });

  it('reports data that inflates past the limit', async () => {
    expect(await decodePayload('big')).toStrictEqual({
      ok: false,
      error: 'The link data decompresses to more than the 10 MiB limit.',
    });
  });

  it('reports data that is not gzip', async () => {
    expect(await decodePayload('junk')).toStrictEqual({
      ok: false,
      error: 'The link data is not valid gzip. The link may have been cut off or altered.',
    });
  });

  it('reports bytes that are not UTF-8', async () => {
    expect(await decodePayload('latin1')).toStrictEqual({ ok: false, error: 'The link data is not valid UTF-8 text.' });
  });
});
