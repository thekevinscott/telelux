import { describe, expect, it } from 'vitest';

import { type Extent, targetBlock } from './target-block';

const at = (...tops: number[]): Extent[] => tops.map((top) => ({ top, bottom: top + 100 }));

describe('targetBlock', () => {
  it('returns undefined when there are no blocks', () => {
    expect(targetBlock([], 800, undefined, 1)).toBeUndefined();
  });

  describe('with no tracked block', () => {
    it('steps from the block nearest the top of the viewport', () => {
      const extents = at(-250, -150, -50, 50, 150);
      expect(targetBlock(extents, 800, undefined, 1)).toBe(3);
      expect(targetBlock(extents, 800, undefined, -1)).toBe(1);
    });

    it('treats a block ending exactly at the top as scrolled past', () => {
      expect(targetBlock(at(-100, 0, 100), 800, undefined, 1)).toBe(2);
    });

    it('steps back from the last block when every block is above the viewport', () => {
      expect(targetBlock(at(-400, -300, -200), 800, undefined, -1)).toBe(1);
    });
  });

  describe('with a tracked block', () => {
    it('steps from it while it is still in the viewport', () => {
      expect(targetBlock(at(0, 100, 200, 300), 800, 2, 1)).toBe(3);
      expect(targetBlock(at(0, 100, 200, 300), 800, 2, -1)).toBe(1);
    });

    it('falls back to the topmost block once it has scrolled above the viewport', () => {
      expect(targetBlock(at(-300, -200, -100, 0, 100), 800, 0, 1)).toBe(4);
    });

    it('falls back to the topmost block once it has scrolled below the viewport', () => {
      expect(targetBlock(at(0, 100, 800, 900), 800, 2, 1)).toBe(1);
    });

    it('treats it as scrolled past once it ends exactly at the top', () => {
      expect(targetBlock([{ top: -100, bottom: 0 }, { top: 0, bottom: 100 }, { top: 100, bottom: 200 }], 800, 0, 1)).toBe(2);
    });

    it('ignores an index past the end of the list', () => {
      expect(targetBlock(at(0, 100), 800, 7, 1)).toBe(1);
    });
  });

  it('clamps at the first and last blocks', () => {
    expect(targetBlock(at(0, 100, 200), 800, 0, -1)).toBe(0);
    expect(targetBlock(at(0, 100, 200), 800, 2, 1)).toBe(2);
  });
});
