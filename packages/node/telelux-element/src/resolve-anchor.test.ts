import { describe, expect, it } from 'vitest';

import { resolveAnchor } from './resolve-anchor';
import type { ChatMessage } from './transcript';

const messages: ChatMessage[] = [
  { role: 'user', content: 'go', metadata: { uuid: 'u0' } },
  { role: 'assistant', content: 'thinking', metadata: { uuid: 'ua', mergedUuids: 'not-a-list' } },
  {
    role: 'assistant',
    content: 'reading',
    metadata: { uuid: 'u1', mergedUuids: ['u1b', 'u1c'] },
    tool_calls: [{ id: 'call_1', function: 'Read', type: 'function' }],
  },
  { role: 'tool', content: 'ok', tool_call_id: 'call_1', metadata: { uuid: 'u2' } },
  { role: 'tool', content: 'orphan', tool_call_id: 'call_x', metadata: { uuid: 'u2' } },
  { role: 'system', content: 'raw', metadata: { raw: true } },
];

describe('resolveAnchor', () => {
  describe('by uuid', () => {
    it('finds the message whose metadata carries the uuid', () => {
      expect(resolveAnchor(messages, { uuid: 'u0' })).toBe(0);
      expect(resolveAnchor(messages, { uuid: 'u1' })).toBe(2);
      expect(resolveAnchor(messages, { uuid: 'not-a-list' })).toBeUndefined();
    });

    it('finds the message an assistant record was merged into', () => {
      expect(resolveAnchor(messages, { uuid: 'u1c' })).toBe(2);
    });

    it('takes the first message when several share a uuid', () => {
      expect(resolveAnchor(messages, { uuid: 'u2' })).toBe(3);
    });
  });

  describe('by tool_call_id', () => {
    it('prefers the assistant message that made the call', () => {
      expect(resolveAnchor(messages, { tool_call_id: 'call_1' })).toBe(2);
    });

    it('matches a user message that carries the id', () => {
      expect(resolveAnchor([{ role: 'user', content: 'r', tool_call_id: 'c' }], { tool_call_id: 'c' })).toBe(0);
    });

    it('falls back to the tool message that carries the id', () => {
      expect(resolveAnchor(messages, { tool_call_id: 'call_x' })).toBe(4);
    });
  });

  describe('by index', () => {
    it('takes an index inside the transcript', () => {
      expect(resolveAnchor(messages, { index: 0 })).toBe(0);
      expect(resolveAnchor(messages, { index: 5 })).toBe(5);
    });

    it('rejects an index past the end', () => {
      expect(resolveAnchor(messages, { index: 6 })).toBeUndefined();
    });
  });

  describe('with several identities', () => {
    it('tries uuid, then tool_call_id, then index', () => {
      expect(resolveAnchor(messages, { uuid: 'u2', tool_call_id: 'call_1', index: 0 })).toBe(3);
      expect(resolveAnchor(messages, { uuid: 'gone', tool_call_id: 'call_1', index: 0 })).toBe(2);
      expect(resolveAnchor(messages, { uuid: 'gone', tool_call_id: 'gone', index: 5 })).toBe(5);
    });

    it('resolves nothing when no identity matches', () => {
      expect(resolveAnchor(messages, { uuid: 'gone', tool_call_id: 'gone' })).toBeUndefined();
      expect(resolveAnchor([], { index: 0 })).toBeUndefined();
    });
  });
});
