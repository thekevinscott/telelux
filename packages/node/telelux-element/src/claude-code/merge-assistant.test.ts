import { describe, expect, it, vi } from 'vitest';

import { mergeAssistant } from './merge-assistant';

vi.mock('./merged-metadata', async () => {
  const actual = await vi.importActual<typeof import('./merged-metadata')>('./merged-metadata');
  return { ...actual, mergedMetadata: vi.fn(actual.mergedMetadata) };
});

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
      metadata: { messageId: 'm', uuid: 'first', mergedUuids: ['second'] },
      tool_calls: [
        { id: 'a', function: 'Read', type: 'function' },
        { id: 'b', function: 'Bash', type: 'function' },
      ],
    });
  });

  it('appends each further merged uuid in order', () => {
    const first = mergeAssistant({ role: 'assistant', content: [], metadata: { uuid: 'a' } }, { role: 'assistant', content: [], metadata: { uuid: 'b' } });
    const second = mergeAssistant(first, { role: 'assistant', content: [], metadata: { uuid: 'c' } });
    expect(second.metadata).toEqual({ uuid: 'a', mergedUuids: ['b', 'c'] });
    expect(first.metadata).toEqual({ uuid: 'a', mergedUuids: ['b'] });
  });

  it('adds no merged uuids when the next record has none', () => {
    const merged = mergeAssistant({ role: 'assistant', content: [], metadata: { uuid: 'a' } }, { role: 'assistant', content: [], metadata: {} });
    expect(merged.metadata).toEqual({ uuid: 'a' });
    expect(mergeAssistant({ role: 'assistant', content: [] }, { role: 'assistant', content: [] })).not.toHaveProperty('metadata');
  });

  it('turns string content into a text item and drops an empty string', () => {
    const merged = mergeAssistant({ role: 'assistant', content: 'one' }, { role: 'assistant', content: '' });
    expect(merged.content).toEqual([{ type: 'text', text: 'one' }]);
  });

  it('omits tool_calls when neither side has any', () => {
    expect(mergeAssistant({ role: 'assistant', content: [] }, { role: 'assistant', content: [] })).not.toHaveProperty('tool_calls');
  });
});
