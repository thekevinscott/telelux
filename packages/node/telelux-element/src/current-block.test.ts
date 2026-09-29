import { describe, expect, it } from 'vitest';

import { currentBlock } from './current-block';
import type { Extent } from './target-block';

const at = (...tops: number[]): Extent[] => tops.map((top) => ({ top, bottom: top + 100 }));

describe('currentBlock', () => {
  it('returns undefined when there are no blocks', () => {
    expect(currentBlock([], 800, undefined)).toBeUndefined();
    expect(currentBlock([], 800, 0)).toBeUndefined();
  });

  describe('with no tracked block', () => {
    it('is the first block not scrolled past', () => {
      expect(currentBlock(at(-250, -150, -50, 50), 800, undefined)).toBe(2);
    });

    it('treats a block ending exactly at the top as scrolled past', () => {
      expect(currentBlock(at(-100, 0, 100), 800, undefined)).toBe(1);
    });

    it('is the last block when every block is above the viewport', () => {
      expect(currentBlock(at(-400, -300, -200), 800, undefined)).toBe(2);
    });
  });

  describe('with a tracked block', () => {
    it('keeps it while it is in the viewport', () => {
      expect(currentBlock(at(0, 100, 200, 300), 800, 2)).toBe(2);
    });

    it('keeps it while only its last pixel is in the viewport', () => {
      expect(currentBlock([{ top: -100, bottom: 1 }, { top: 1, bottom: 100 }], 800, 0)).toBe(0);
    });

    it('keeps it while only its first pixel is in the viewport', () => {
      expect(currentBlock(at(0, 100, 799), 800, 2)).toBe(2);
    });

    it('drops it once it ends exactly at the top', () => {
      expect(currentBlock([{ top: -100, bottom: 0 }, { top: 0, bottom: 100 }], 800, 0)).toBe(1);
    });

    it('drops it once it starts exactly at the bottom', () => {
      expect(currentBlock(at(0, 100, 800), 800, 2)).toBe(0);
    });

    it('ignores an index past the end of the list', () => {
      expect(currentBlock(at(0, 100), 800, 7)).toBe(0);
    });
  });
});
