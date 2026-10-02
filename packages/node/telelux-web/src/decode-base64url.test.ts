import { describe, expect, it } from 'vitest';

import vector from '../../../../fixtures/link/v1.json';
import { decodeBase64url } from './decode-base64url';

describe('decodeBase64url', () => {
  it('decodes unpadded base64url, including the - and _ characters', () => {
    expect(Array.from(decodeBase64url('-_8') ?? [])).toStrictEqual([0xfb, 0xff]);
    expect(Array.from(decodeBase64url('aGk') ?? [])).toStrictEqual([0x68, 0x69]);
    expect(Array.from(decodeBase64url('aGVsbG8') ?? [])).toStrictEqual([0x68, 0x65, 0x6c, 0x6c, 0x6f]);
  });

  it('decodes an empty value to no bytes', () => {
    expect(decodeBase64url('')).toHaveLength(0);
  });

  it('rejects characters outside the base64url alphabet', () => {
    expect(decodeBase64url('aGk+')).toBeUndefined();
    expect(decodeBase64url('aGk/')).toBeUndefined();
    expect(decodeBase64url('aGk=')).toBeUndefined();
    expect(decodeBase64url('aG k')).toBeUndefined();
    expect(decodeBase64url('aGk%')).toBeUndefined();
  });

  it('rejects a length no byte sequence encodes to', () => {
    expect(decodeBase64url('aGVsb')).toBeUndefined();
  });

  it('decodes the link vector the Python package encodes to its gzip bytes', () => {
    expect(Array.from(decodeBase64url(vector.data) ?? [])).toStrictEqual(Array.from(Buffer.from(vector.gzip, 'hex')));
  });
});
