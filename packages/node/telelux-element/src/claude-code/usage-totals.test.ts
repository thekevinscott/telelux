import { describe, expect, it } from 'vitest';

import { usageTotals } from './usage-totals';

describe('usageTotals', () => {
  it('sums the token counts over every message that carries usage', () => {
    expect(
      usageTotals([
        { role: 'assistant', content: '', metadata: { usage: { input_tokens: 1, output_tokens: 2 } } },
        { role: 'user', content: '' },
        { role: 'assistant', content: '', metadata: { usage: { input_tokens: 3, cache_read_input_tokens: 4, output_tokens: 'x' } } },
        { role: 'assistant', content: '', metadata: { usage: 'none' } },
        { role: 'assistant', content: '', metadata: { usage: [1] } },
      ]),
    ).toEqual({ input_tokens: 4, cache_creation_input_tokens: 0, cache_read_input_tokens: 4, output_tokens: 2 });
  });

  it('is all zeros for no messages', () => {
    expect(usageTotals([])).toEqual({ input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 });
  });
});
