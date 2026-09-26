import { describe, expect, it } from 'vitest';

import { userMessages } from './user-messages';

const toolNames = new Map([['call_1', 'Bash']]);

describe('userMessages', () => {
  it('maps a string prompt to one user message', () => {
    expect(userMessages({ type: 'user', uuid: 'u1', message: { content: 'hi' } }, toolNames)).toEqual([
      { role: 'user', content: 'hi', metadata: { type: 'user', uuid: 'u1' } },
    ]);
  });

  it('maps each tool result to its own tool message', () => {
    const record = {
      type: 'user',
      message: {
        content: [
          { type: 'tool_result', tool_use_id: 'call_1', content: 'a' },
          { type: 'tool_result', tool_use_id: 'call_2', content: 'b' },
        ],
      },
    };
    expect(userMessages(record, toolNames)).toEqual([
      { role: 'tool', content: 'a', tool_call_id: 'call_1', function: 'Bash', metadata: { type: 'user' } },
      { role: 'tool', content: 'b', tool_call_id: 'call_2', metadata: { type: 'user' } },
    ]);
  });

  it('groups consecutive non-result blocks into user messages around the tool results', () => {
    const record = {
      type: 'user',
      message: {
        content: [
          { type: 'text', text: 'before' },
          { type: 'image' },
          { type: 'tool_result', tool_use_id: 'call_1', content: 'a' },
          { type: 'text', text: 'after' },
        ],
      },
    };
    expect(userMessages(record, toolNames)).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'before' }, { type: 'image' }], metadata: { type: 'user' } },
      { role: 'tool', content: 'a', tool_call_id: 'call_1', function: 'Bash', metadata: { type: 'user' } },
      { role: 'user', content: [{ type: 'text', text: 'after' }], metadata: { type: 'user' } },
    ]);
  });

  it('yields nothing for an empty block list', () => {
    expect(userMessages({ type: 'user', message: { content: [] } }, toolNames)).toEqual([]);
  });

  it('yields nothing when the message is missing', () => {
    expect(userMessages({ type: 'user' }, toolNames)).toEqual([]);
  });
});
