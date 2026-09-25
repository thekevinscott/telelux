import { describe, expect, it } from 'vitest';

import { usage } from './usage';

describe('usage', () => {
  it('keeps the four token counts and drops the rest', () => {
    expect(
      usage({
        usage: {
          input_tokens: 1,
          cache_creation_input_tokens: 2,
          cache_read_input_tokens: 3,
          output_tokens: 4,
          service_tier: 'standard',
          cache_creation: { ephemeral_5m_input_tokens: 2 },
        },
      }),
    ).toEqual({ input_tokens: 1, cache_creation_input_tokens: 2, cache_read_input_tokens: 3, output_tokens: 4 });
  });

  it('keeps only the counts that are numbers', () => {
    expect(usage({ usage: { input_tokens: 1, output_tokens: '4' } })).toEqual({ input_tokens: 1 });
  });

  it('returns undefined without a usage object', () => {
    expect(usage({})).toBeUndefined();
    expect(usage({ usage: null })).toBeUndefined();
    expect(usage({ usage: 'x' })).toBeUndefined();
  });

  it('returns undefined when no count is present', () => {
    expect(usage({ usage: { service_tier: 'standard' } })).toBeUndefined();
  });
});
