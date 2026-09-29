import { describe, expect, it } from 'vitest';

import { blockNumber } from './block-number';

describe('blockNumber', () => {
  it('reads a block index', () => {
    expect(blockNumber('3', 10)).toBe(3);
  });

  it('tolerates surrounding whitespace', () => {
    expect(blockNumber(' 0 ', 10)).toBe(0);
  });

  it('clamps an index past the end to the last block', () => {
    expect(blockNumber('99', 10)).toBe(9);
  });

  it.each(['', '-1', '1.5', 'two', '1e2'])('rejects %j', (value) => {
    expect(blockNumber(value, 10)).toBeUndefined();
  });

  it('rejects everything when there are no blocks', () => {
    expect(blockNumber('0', 0)).toBeUndefined();
  });
});
