import { describe, expect, it } from 'vitest';

import { mergeAssistant } from './merge-assistant';

describe('mergeAssistant', () => {
  it('concatenates content and tool calls, keeping the first message metadata', () => {
    const merged = mergeAssistant(
      {
        role: 'assistant',
        content: [{ type: 'reasoning', reasoning: 'plan' }],
        metadata: { messageId: 'm', uuid: 'first' },
        tool_calls: [{ id: 'a', function: 'Read', type: 'function' }],
      },
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'go' }],
        metadata: { messageId: 'm', uuid: 'second' },
        tool_calls: [{ id: 'b', function: 'Bash', type: 'function' }],
      },
    );
    expect(merged).toEqual({
      role: 'assistant',
      content: [
        { type: 'reasoning', reasoning: 'plan' },
        { type: 'text', text: 'go' },
      ],
      metadata: { messageId: 'm', uuid: 'first' },
      tool_calls: [
        { id: 'a', function: 'Read', type: 'function' },
        { id: 'b', function: 'Bash', type: 'function' },
      ],
    });
  });

  it('turns string content into a text item and drops an empty string', () => {
    const merged = mergeAssistant({ role: 'assistant', content: 'one' }, { role: 'assistant', content: '' });
    expect(merged.content).toEqual([{ type: 'text', text: 'one' }]);
  });

  it('omits tool_calls when neither side has any', () => {
    expect(mergeAssistant({ role: 'assistant', content: [] }, { role: 'assistant', content: [] })).not.toHaveProperty('tool_calls');
  });
});
