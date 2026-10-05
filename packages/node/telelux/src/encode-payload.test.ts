import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { encodePayload } from './encode-payload';

const vector = JSON.parse(readFileSync(new URL('../../../../fixtures/link/v1.json', import.meta.url), 'utf8')) as {text: string; data: string; gzip: string};

describe('encodePayload', () => {
  it('matches the shared Python gzip and data bytes', () => {
    expect(encodePayload(vector.text)).toBe(vector.data);
    expect(Buffer.from(encodePayload(vector.text), 'base64url').toString('hex')).toBe(vector.gzip);
  });
});
