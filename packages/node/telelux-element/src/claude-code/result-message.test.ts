import { describe, expect, it } from 'vitest';

import { resultMessage } from './result-message';

describe('resultMessage', () => {
  it('summarizes subtype, cost, duration, turns, and error', () => {
    const record = { type: 'result', subtype: 'success', total_cost_usd: 0.04212, duration_ms: 12345, num_turns: 4, is_error: true };
    expect(resultMessage(record)).toEqual({
      role: 'system',
      content: 'success · $0.0421 · 12.3s · 4 turns · error',
      metadata: { type: 'result', subtype: 'success', total_cost_usd: 0.04212, duration_ms: 12345, num_turns: 4, is_error: true },
    });
  });

  it('falls back to "result" when nothing is known', () => {
    expect(resultMessage({ type: 'result', is_error: false })).toEqual({ role: 'system', content: 'result', metadata: { type: 'result' } });
  });

  it('skips fields of the wrong type', () => {
    expect(resultMessage({ type: 'result', total_cost_usd: '1', duration_ms: null, num_turns: 'x' }).content).toBe('result');
  });
});
