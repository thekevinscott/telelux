import { describe, expect, it } from 'vitest';

import { resolveAnchor } from './resolve-anchor';
import type { ChatMessage } from './transcript';

const messages: ChatMessage[] = [
  { role: 'system', content: 'rules' },
  { role: 'assistant', content: 'thinking', metadata: { uuid: 'ua', mergedUuids: 'not-a-list' } },
  {
    role: 'assistant',
    content: 'reading',
    metadata: { uuid: 'u1', mergedUuids: ['u1b', 'u1c'] },
    tool_calls: [
      { id: 'call_0', function: 'Read', type: 'function' },
      { id: 'call_1', function: 'Read', type: 'function' },
    ],
  },
  { role: 'tool', content: 'ok', tool_call_id: 'call_1', metadata: { uuid: 'u2' } },
  { role: 'tool', content: 'orphan', tool_call_id: 'call_x', metadata: { uuid: 'u2' } },
  { role: 'tool', content: 'unlinked' },
  { role: 'user', content: 'result', tool_call_id: 'call_u' },
];

const strays = [
  { role: 'system', content: 'x', tool_call_id: 'call_s' },
  { role: 'user', content: 'x', tool_calls: [{ id: 'call_s', function: 'Read', type: 'function' }] },
  { role: 'tool', content: 'x', tool_call_id: 'call_s' },
] as ChatMessage[];

describe('resolveAnchor', () => {
  describe('by uuid', () => {
    it('finds the message whose metadata carries the uuid', () => {
      expect(resolveAnchor(messages, { uuid: 'ua' })).toBe(1);
      expect(resolveAnchor(messages, { uuid: 'u1' })).toBe(2);
    });

    it('finds the message an assistant record was merged into', () => {
      expect(resolveAnchor(messages, { uuid: 'u1b' })).toBe(2);
      expect(resolveAnchor(messages, { uuid: 'u1c' })).toBe(2);
    });

    it('reads merged uuids only from a list', () => {
      expect(resolveAnchor(messages, { uuid: 'not-a-list' })).toBeUndefined();
    });

    it('takes the first message when several share a uuid', () => {
      expect(resolveAnchor(messages, { uuid: 'u2' })).toBe(3);
    });
  });

  describe('by tool_call_id', () => {
    it('prefers the assistant message that made the call', () => {
      expect(resolveAnchor(messages, { tool_call_id: 'call_1' })).toBe(2);
    });

    it('falls back to the tool or user message that carries the id', () => {
      expect(resolveAnchor(messages, { tool_call_id: 'call_x' })).toBe(4);
      expect(resolveAnchor(messages, { tool_call_id: 'call_u' })).toBe(6);
    });

    it('ignores ids on messages whose role cannot carry them', () => {
      expect(resolveAnchor(strays, { tool_call_id: 'call_s' })).toBe(2);
    });
  });

  describe('by index', () => {
    it('takes an index inside the transcript', () => {
      expect(resolveAnchor(messages, { index: 0 })).toBe(0);
      expect(resolveAnchor(messages, { index: 5 })).toBe(5);
      expect(resolveAnchor(messages, { index: 6 })).toBe(6);
    });

    it('rejects an index past the end', () => {
      expect(resolveAnchor(messages, { index: 7 })).toBeUndefined();
    });
  });

  describe('with several identities', () => {
    it('tries uuid, then tool_call_id, then index', () => {
      expect(resolveAnchor(messages, { uuid: 'u2', tool_call_id: 'call_1', index: 0 })).toBe(3);
      expect(resolveAnchor(messages, { uuid: 'gone', tool_call_id: 'call_1', index: 0 })).toBe(2);
      expect(resolveAnchor(messages, { uuid: 'gone', tool_call_id: 'call_x', index: 0 })).toBe(4);
      expect(resolveAnchor(messages, { uuid: 'gone', tool_call_id: 'gone', index: 5 })).toBe(5);
    });

    it('resolves nothing when no identity matches', () => {
      expect(resolveAnchor(messages, { uuid: 'gone', tool_call_id: 'gone' })).toBeUndefined();
      expect(resolveAnchor([], { index: 0 })).toBeUndefined();
    });
  });
});
