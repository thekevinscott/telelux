import { describe, expect, it } from 'vitest';

import { assistantMessage } from './assistant-message';

const record = {
  type: 'assistant',
  uuid: 'a1',
  timestamp: 't1',
  message: {
    id: 'msg_1',
    model: 'claude-opus-5',
    role: 'assistant',
    content: [
      { type: 'thinking', thinking: 'plan' },
      { type: 'text', text: 'Running it.' },
      { type: 'tool_use', id: 'call_1', name: 'Bash', input: { command: 'ls' } },
    ],
    usage: { input_tokens: 1, output_tokens: 2 },
  },
};

describe('assistantMessage', () => {
  it('maps content, tool calls, and metadata', () => {
    expect(assistantMessage(record, new Map())).toEqual({
      role: 'assistant',
      content: [
        { type: 'reasoning', reasoning: 'plan' },
        { type: 'text', text: 'Running it.' },
      ],
      tool_calls: [{ id: 'call_1', function: 'Bash', type: 'function', arguments: { command: 'ls' } }],
      metadata: {
        type: 'assistant',
        uuid: 'a1',
        timestamp: 't1',
        messageId: 'msg_1',
        model: 'claude-opus-5',
        usage: { input_tokens: 1, output_tokens: 2 },
      },
    });
  });

  it('registers each tool call name by id', () => {
    const toolNames = new Map<string, string>();
    assistantMessage(record, toolNames);
    expect(toolNames.get('call_1')).toBe('Bash');
  });

  it('keeps string content as is and omits tool_calls when there are none', () => {
    const message = assistantMessage({ type: 'assistant', message: { content: 'plain' } }, new Map());
    expect(message).toEqual({ role: 'assistant', content: 'plain', metadata: { type: 'assistant' } });
    expect(message).not.toHaveProperty('tool_calls');
  });

  it('omits messageId, model, and usage when the message lacks them', () => {
    expect(assistantMessage({ type: 'assistant', message: { content: [] } }, new Map()).metadata).toEqual({ type: 'assistant' });
  });

  it('treats a missing message as empty content', () => {
    expect(assistantMessage({ type: 'assistant' }, new Map()).content).toEqual([]);
  });
});
