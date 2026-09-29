import { describe, expect, it } from 'vitest';

import { stripScroll } from './strip-scroll';

describe('stripScroll', () => {
  it('keeps the scroll position while the chip is fully visible', () => {
    expect(stripScroll(100, 10, 50, 200)).toBe(50);
  });

  it('keeps the scroll position when the chip touches either edge', () => {
    expect(stripScroll(50, 10, 50, 200)).toBe(50);
    expect(stripScroll(240, 10, 50, 200)).toBe(50);
  });

  it('scrolls back so a chip left of the view starts at its left edge', () => {
    expect(stripScroll(20, 10, 50, 200)).toBe(20);
  });

  it('scrolls forward so a chip right of the view ends at its right edge', () => {
    expect(stripScroll(245, 10, 50, 200)).toBe(55);
  });
});
