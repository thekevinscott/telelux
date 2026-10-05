import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildLink } from './build-link';

const vector = JSON.parse(readFileSync(new URL('../../../../fixtures/link/v1.json', import.meta.url), 'utf8')) as {text: string; data: string};

describe('buildLink', () => {
  it('matches the shared link vector', () => expect(buildLink(vector.text)).toBe(`https://telelux.dev/#v=1&data=${vector.data}`));
  it('rejects a link over the character limit', () => expect(() => buildLink(randomBytes(6000).toString('hex'))).toThrow('8000-character limit'));
  it('rejects a transcript over the byte limit', () => expect(() => buildLink('x'.repeat(10 * 1024 * 1024 + 1))).toThrow('10 MiB'));
});
