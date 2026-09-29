import { describe, expect, it } from 'vitest';

import { type Extent, targetBlock } from './target-block';

const at = (...tops: number[]): Extent[] => tops.map((top) => ({ top, bottom: top + 100 }));

describe('targetBlock', () => {
  it('returns undefined when there are no blocks', () => {
    expect(targetBlock([], 800, undefined, 1)).toBeUndefined();
  });

  it('steps from the block nearest the top of the viewport', () => {
    const extents = at(-250, -150, -50, 50, 150);
    expect(targetBlock(extents, 800, undefined, 1)).toBe(3);
    expect(targetBlock(extents, 800, undefined, -1)).toBe(1);
  });

  it('steps from a tracked block while it is on screen', () => {
    expect(targetBlock(at(0, 100, 200, 300), 800, 2, 1)).toBe(3);
    expect(targetBlock(at(0, 100, 200, 300), 800, 2, -1)).toBe(1);
  });

  it('steps back from the last block when every block is above the viewport', () => {
    expect(targetBlock(at(-400, -300, -200), 800, undefined, -1)).toBe(1);
  });

  it('clamps at the first and last blocks', () => {
    expect(targetBlock(at(0, 100, 200), 800, 0, -1)).toBe(0);
    expect(targetBlock(at(0, 100, 200), 800, 2, 1)).toBe(2);
  });
});
