import { describe, expect, it } from 'vitest';

import { definedEntries } from './defined-entries';

describe('definedEntries', () => {
  it('returns no entries for missing metadata', () => {
    expect(definedEntries(undefined)).toEqual([]);
  });

  it('returns entries in key order', () => {
    expect(definedEntries({ b: 1, a: 'x' })).toEqual([['b', 1], ['a', 'x']]);
  });

  it('drops keys whose value is undefined and keeps falsy values', () => {
    expect(definedEntries({ gone: undefined, zero: 0, empty: '', no: false })).toEqual([['zero', 0], ['empty', ''], ['no', false]]);
  });
});
