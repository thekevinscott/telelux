import { describe, expect, it } from 'vitest';

import { asBlocks, asRecord, isRecord, str } from './records';

describe('records', () => {
  describe('isRecord', () => {
    it.each([
      ['an object', {}, true],
      ['an array', [], false],
      ['null', null, false],
      ['a string', 'x', false],
    ])('classifies %s', (_label, value, expected) => {
      expect(isRecord(value)).toBe(expected);
    });
  });

  describe('asRecord', () => {
    it('returns the object as is', () => {
      const value = { a: 1 };
      expect(asRecord(value)).toBe(value);
    });

    it('returns an empty object for anything else', () => {
      expect(asRecord('x')).toEqual({});
    });
  });

  describe('asBlocks', () => {
    it('keeps only the object items of an array', () => {
      expect(asBlocks([{ type: 'text' }, 'x', null, [1]])).toEqual([{ type: 'text' }]);
    });

    it('returns nothing for a non-array', () => {
      expect(asBlocks('text')).toEqual([]);
    });
  });

  describe('str', () => {
    it('returns a string as is and anything else as empty', () => {
      expect(str('a')).toBe('a');
      expect(str(3)).toBe('');
      expect(str(undefined)).toBe('');
    });
  });
});
