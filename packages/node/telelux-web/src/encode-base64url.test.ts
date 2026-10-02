import { describe, expect, it } from 'vitest';

import { encodeBase64url } from './encode-base64url';

describe('encodeBase64url', () => {
  it('encodes unpadded base64url, using - and _ in place of + and /', () => {
    expect(encodeBase64url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
    expect(encodeBase64url(new Uint8Array([0x68, 0x69]))).toBe('aGk');
    expect(encodeBase64url(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]))).toBe('aGVsbG8');
    expect(encodeBase64url(new Uint8Array([0x68, 0x65, 0x6c]))).toBe('aGVs');
  });

  it('encodes no bytes to an empty value', () => {
    expect(encodeBase64url(new Uint8Array())).toBe('');
  });

  it('encodes every byte value', () => {
    const all = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(encodeBase64url(all)).toBe(btoa(String.fromCharCode(...all)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''));
  });
});
