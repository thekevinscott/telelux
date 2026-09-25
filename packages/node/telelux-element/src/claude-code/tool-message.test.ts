import { describe, expect, it } from 'vitest';

import { toolMessage } from './tool-message';

const metadata = { type: 'user', uuid: 'u1' };
const toolNames = new Map([['call_1', 'Bash']]);

describe('toolMessage', () => {
  it('maps a string result to a tool message naming its call', () => {
    expect(toolMessage({ type: 'tool_result', tool_use_id: 'call_1', content: 'ok' }, toolNames, metadata)).toEqual({
      role: 'tool',
      content: 'ok',
      tool_call_id: 'call_1',
      function: 'Bash',
      metadata,
    });
  });

  it('maps block content to content items', () => {
    const block = { type: 'tool_result', tool_use_id: 'call_1', content: [{ type: 'text', text: 'a' }, { type: 'image' }] };
    expect(toolMessage(block, toolNames, metadata).content).toEqual([{ type: 'text', text: 'a' }, { type: 'image' }]);
  });

  it('omits the function when the call id is unknown', () => {
    const message = toolMessage({ type: 'tool_result', tool_use_id: 'call_9', content: 'ok' }, toolNames, metadata);
    expect(message).not.toHaveProperty('function');
    expect(message.role === 'tool' && message.tool_call_id).toBe('call_9');
  });

  it('carries an error whose message is the result text', () => {
    const block = { type: 'tool_result', tool_use_id: 'call_1', is_error: true, content: [{ type: 'text', text: 'boom' }] };
    const message = toolMessage(block, toolNames, metadata);
    expect(message.role === 'tool' && message.error).toEqual({ type: 'tool_result', message: 'boom' });
  });

  it('has no error when is_error is absent or false', () => {
    const block = { type: 'tool_result', tool_use_id: 'call_1', is_error: false, content: 'fine' };
    expect(toolMessage(block, toolNames, metadata)).not.toHaveProperty('error');
  });

  it('treats missing content as an empty item list', () => {
    expect(toolMessage({ type: 'tool_result', tool_use_id: 'call_1' }, toolNames, metadata).content).toEqual([]);
  });
});
