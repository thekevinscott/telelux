import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { buildLink } from './build-link';

vi.mock('./encode-payload', async () => {
  const actual = await vi.importActual<typeof import('./encode-payload')>('./encode-payload');
  const encodePayload: typeof actual.encodePayload = (text) => text === 'boundary' ? 'x'.repeat(8000 - 'https://telelux.dev/#v=1&data='.length) : text.length === 10 * 1024 * 1024 && text[0] === 'x' ? 'short' : actual.encodePayload(text);
  return { ...actual, encodePayload: vi.fn(encodePayload) };
});

const vector = JSON.parse(readFileSync(new URL('../../../../fixtures/link/v1.json', import.meta.url), 'utf8')) as {text: string; data: string};

describe('buildLink', () => {
  it('matches the shared link vector', () => expect(buildLink(vector.text)).toBe(`https://telelux.dev/#v=1&data=${vector.data}`));
  it('rejects a link over the character limit', () => expect(() => buildLink(randomBytes(6000).toString('hex'))).toThrow('8000-character limit'));
  it('rejects a transcript over the byte limit', () => expect(() => buildLink('x'.repeat(10 * 1024 * 1024 + 1))).toThrow('10 MiB'));
  it('allows the byte and character limits exactly', () => {
    expect(() => buildLink('x'.repeat(10 * 1024 * 1024))).not.toThrow();
    expect(buildLink('boundary')).toHaveLength(8000);
  });
  it('describes alternatives when the link is too long', () => {
    expect(() => buildLink(randomBytes(6000).toString('hex'))).toThrow('baked HTML');
    expect(() => buildLink(randomBytes(6000).toString('hex'))).toThrow('https://telelux.dev/#v=1&data=<transcript-url>');
  });
});
