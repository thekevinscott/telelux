import { describe, expect, it } from 'vitest';

import { tickStep } from './tick-step';

describe('tickStep', () => {
  it('ticks every block when there are few', () => {
    expect(tickStep(1, 1)).toBe(1);
    expect(tickStep(8, 1)).toBe(1);
  });

  it('rounds up to 1, 2, or 5 times a power of ten for about eight ticks', () => {
    expect(tickStep(9, 1)).toBe(2);
    expect(tickStep(16, 1)).toBe(2);
    expect(tickStep(17, 1)).toBe(5);
    expect(tickStep(40, 1)).toBe(5);
    expect(tickStep(41, 1)).toBe(10);
    expect(tickStep(500, 1)).toBe(100);
    expect(tickStep(4001, 1)).toBe(1000);
  });

  it('ticks more finely as the zoom grows', () => {
    expect(tickStep(500, 4)).toBe(20);
    expect(tickStep(500, 16)).toBe(5);
  });
});
