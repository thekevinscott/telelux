import { describe, expect, it } from 'vitest';

import { parseJsonObject } from './parse-json-object';

describe('parseJsonObject', () => {
  it('returns the object for a JSON object line', () => {
    expect(parseJsonObject('{"type":"user","n":1}')).toEqual({ type: 'user', n: 1 });
  });

  it.each([
    ['malformed JSON', 'not json'],
    ['an array', '[1,2]'],
    ['a string', '"x"'],
    ['a number', '3'],
    ['null', 'null'],
  ])('returns undefined for %s', (_label, line) => {
    expect(parseJsonObject(line)).toBeUndefined();
  });
});
