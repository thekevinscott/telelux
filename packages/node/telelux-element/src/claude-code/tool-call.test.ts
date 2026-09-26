import { describe, expect, it } from 'vitest';

import { toolCall } from './tool-call';

describe('toolCall', () => {
  it('maps a tool_use block to a function call', () => {
    expect(toolCall({ type: 'tool_use', id: 't1', name: 'Bash', input: { command: 'ls' } })).toEqual({
      id: 't1',
      function: 'Bash',
      type: 'function',
      arguments: { command: 'ls' },
    });
  });

  it('falls back to empty fields when the block is incomplete', () => {
    expect(toolCall({ type: 'tool_use' })).toEqual({ id: '', function: '', type: 'function', arguments: {} });
  });
});
