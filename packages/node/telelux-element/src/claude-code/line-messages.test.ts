import { describe, expect, it } from 'vitest';

import { lineMessages } from './line-messages';

const toolNames = new Map<string, string>();
const line = (record: Record<string, unknown>) => ({ line: JSON.stringify(record), record });

describe('lineMessages', () => {
  it('keeps a malformed line as a raw system message', () => {
    expect(lineMessages({ line: 'oops', record: undefined }, toolNames)).toEqual([
      { role: 'system', content: 'oops', metadata: { raw: true } },
    ]);
  });

  it('maps a user record through userMessages', () => {
    expect(lineMessages(line({ type: 'user', message: { content: 'hi' } }), toolNames)).toEqual([
      { role: 'user', content: 'hi', metadata: { type: 'user' } },
    ]);
  });

  it('maps an assistant record through assistantMessage', () => {
    expect(lineMessages(line({ type: 'assistant', message: { content: 'yo' } }), toolNames)).toEqual([
      { role: 'assistant', content: 'yo', metadata: { type: 'assistant' } },
    ]);
  });

  it('maps a queue operation', () => {
    expect(lineMessages(line({ type: 'queue-operation', operation: 'enqueue', content: 'go' }), toolNames)).toEqual([
      { role: 'user', content: 'go', metadata: { type: 'queue-operation', operation: 'enqueue' } },
    ]);
  });

  it('maps an attachment', () => {
    expect(lineMessages(line({ type: 'attachment', attachment: { type: 'environment' } }), toolNames)).toEqual([
      { role: 'system', content: 'environment', metadata: { type: 'attachment', attachment: 'environment' } },
    ]);
  });

  it('maps a system record', () => {
    expect(lineMessages(line({ type: 'system', subtype: 'turn_duration' }), toolNames)).toEqual([
      { role: 'system', content: 'turn_duration', metadata: { type: 'system', subtype: 'turn_duration' } },
    ]);
  });

  it('maps a result record', () => {
    expect(lineMessages(line({ type: 'result', num_turns: 2 }), toolNames)).toEqual([
      { role: 'system', content: '2 turns', metadata: { type: 'result', num_turns: 2 } },
    ]);
  });

  it.each([
    ['atis-latch', { type: 'atis-latch', atis: '' }, 'session latch'],
    ['last-prompt', { type: 'last-prompt', lastPrompt: 'again' }, 'again'],
    ['ai-title', { type: 'ai-title', aiTitle: 'Title' }, 'Title'],
    ['custom-title', { type: 'custom-title', customTitle: 'Mine' }, 'Mine'],
  ])('maps a %s marker to a system message', (type, record, content) => {
    expect(lineMessages(line(record), toolNames)).toEqual([{ role: 'system', content, metadata: { type } }]);
  });

  it('surfaces an unknown record type with its whole line', () => {
    const record = { type: 'mode', mode: 'default', uuid: 'u1' };
    expect(lineMessages(line(record), toolNames)).toEqual([
      { role: 'system', content: JSON.stringify(record), metadata: { type: 'mode', uuid: 'u1', unknown: true } },
    ]);
  });
});
