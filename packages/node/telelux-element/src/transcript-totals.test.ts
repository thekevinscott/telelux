import { describe, expect, it } from 'vitest';

import type { ChatMessage } from './transcript';
import { transcriptTotals } from './transcript-totals';

describe('transcriptTotals', () => {
  it('returns empty totals for no messages', () => {
    expect(transcriptTotals([])).toStrictEqual({ usage: {}, toolCalls: 0, roles: {} });
  });

  describe('role counts', () => {
    it('counts only the roles that appear', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'a' },
        { role: 'assistant', content: 'b' },
        { role: 'user', content: 'c' },
      ];
      expect(transcriptTotals(messages).roles).toStrictEqual({ user: 2, assistant: 1 });
    });
  });

  describe('tool calls', () => {
    it('sums the tool calls across assistant messages', () => {
      const call = { id: 'c', function: 'f', type: 'function' };
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '', tool_calls: [call, call] },
        { role: 'assistant', content: '' },
        { role: 'assistant', content: '', tool_calls: [call] },
        { role: 'tool', content: 'result', tool_call_id: 'c' },
      ];
      expect(transcriptTotals(messages).toolCalls).toBe(3);
    });

    it('counts tool calls only on assistant messages', () => {
      const call = { id: 'c', function: 'f', type: 'function' };
      const stray = { role: 'user', content: '', tool_calls: [call] } as unknown as ChatMessage;
      expect(transcriptTotals([stray]).toolCalls).toBe(0);
    });
  });

  describe('usage', () => {
    it('sums each usage key across messages', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '', metadata: { usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 7 } } },
        { role: 'assistant', content: '', metadata: { usage: { input_tokens: 3, output_tokens: 2, cache_read_input_tokens: 50, cache_creation_input_tokens: 0 } } },
      ];
      expect(transcriptTotals(messages).usage).toStrictEqual({
        input_tokens: 13,
        output_tokens: 7,
        cache_read_input_tokens: 150,
        cache_creation_input_tokens: 7,
      });
    });

    it('leaves a key absent when no message reports it', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '', metadata: { usage: { output_tokens: 4 } } },
        { role: 'user', content: 'no usage' },
      ];
      expect(transcriptTotals(messages).usage).toStrictEqual({ output_tokens: 4 });
    });

    it('keeps a reported zero', () => {
      const messages: ChatMessage[] = [{ role: 'assistant', content: '', metadata: { usage: { input_tokens: 0 } } }];
      expect(transcriptTotals(messages).usage).toStrictEqual({ input_tokens: 0 });
    });

    it('ignores usage that is not an object, and values that are not numbers', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '', metadata: { usage: 'lots' } },
        { role: 'assistant', content: '', metadata: { usage: [1, 2] } },
        { role: 'assistant', content: '', metadata: { usage: { input_tokens: '12', other_tokens: 9 } } },
      ];
      expect(transcriptTotals(messages).usage).toStrictEqual({});
    });
  });
});
