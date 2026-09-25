import { describe, expect, it } from 'vitest';

import { systemMessage } from './system-message';

describe('systemMessage', () => {
  it('uses the content string when there is one', () => {
    expect(systemMessage({ type: 'system', subtype: 'local_command', content: 'out', level: 'info', uuid: 'u1' })).toEqual({
      role: 'system',
      content: 'out',
      metadata: { type: 'system', uuid: 'u1', subtype: 'local_command', level: 'info' },
    });
  });

  it('falls back to the subtype as content', () => {
    expect(systemMessage({ type: 'system', subtype: 'turn_duration', durationMs: 5 })).toEqual({
      role: 'system',
      content: 'turn_duration',
      metadata: { type: 'system', subtype: 'turn_duration' },
    });
  });

  it('omits subtype and level when absent', () => {
    expect(systemMessage({ type: 'system' })).toStrictEqual({ role: 'system', content: '', metadata: { type: 'system' } });
  });
});
