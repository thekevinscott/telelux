import { describe, expect, it } from 'vitest';

import { splitJsonl } from './split-jsonl';

describe('splitJsonl', () => {
  it('yields one entry per non-blank line with its parsed record', () => {
    expect(splitJsonl('{"a":1}\n\n   \n{"b":2}\n')).toEqual([
      { line: '{"a":1}', record: { a: 1 } },
      { line: '{"b":2}', record: { b: 2 } },
    ]);
  });

  it('keeps a malformed line with an undefined record', () => {
    expect(splitJsonl('{"a":1}\noops')).toEqual([
      { line: '{"a":1}', record: { a: 1 } },
      { line: 'oops', record: undefined },
    ]);
  });

  it('accepts CRLF line endings', () => {
    expect(splitJsonl('{"a":1}\r\n{"b":2}\r\n')).toEqual([
      { line: '{"a":1}', record: { a: 1 } },
      { line: '{"b":2}', record: { b: 2 } },
    ]);
  });

  it('returns nothing for empty text', () => {
    expect(splitJsonl('')).toEqual([]);
  });
});
