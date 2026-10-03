import { describe, expect, it } from 'vitest';

import { timelineLanes } from './timeline-lanes';

describe('timelineLanes', () => {
  it('puts spans that do not overlap in the first lane', () => {
    expect(timelineLanes([{ start: 0, end: 1 }, { start: 2, end: 2 }, { start: 5, end: 9 }])).toEqual([0, 0, 0]);
  });

  it('moves an overlapping span to the next free lane', () => {
    expect(timelineLanes([{ start: 0, end: 4 }, { start: 2, end: 3 }, { start: 3, end: 6 }, { start: 5, end: 5 }])).toEqual([0, 1, 2, 0]);
  });

  it('treats spans that share a block as overlapping', () => {
    expect(timelineLanes([{ start: 0, end: 2 }, { start: 2, end: 3 }])).toEqual([0, 1]);
  });

  it('packs by start position whatever order the spans arrive in', () => {
    expect(timelineLanes([{ start: 6, end: 8 }, { start: 0, end: 5 }, { start: 1, end: 2 }])).toEqual([0, 0, 1]);
  });

  it('returns no lanes for no spans', () => {
    expect(timelineLanes([])).toEqual([]);
  });
});
