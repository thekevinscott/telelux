import { describe, expect, it } from 'vitest';

import { parseTranscript, type Transcript } from './transcript';

const minimal: Transcript = { id: 't1', messages: [], metadata: {} };

describe('parseTranscript', () => {
  describe('a transcript in docent shape', () => {
    it('accepts the minimal shape and returns the same object', () => {
      const result = parseTranscript(minimal);
      expect(result).toEqual({ ok: true, transcript: minimal });
      expect(result.ok && result.transcript).toBe(minimal);
    });

    it('accepts every role with string content', () => {
      const transcript: Transcript = {
        ...minimal,
        messages: [
          { role: 'system', content: 'be brief' },
          { role: 'user', content: 'hi' },
          { role: 'assistant', content: 'hello' },
          { role: 'tool', content: 'ok' },
        ],
      };
      expect(parseTranscript(transcript).ok).toBe(true);
    });

    it('accepts Content[] with text, reasoning, and image items', () => {
      const transcript: Transcript = {
        ...minimal,
        messages: [
          {
            role: 'assistant',
            content: [
              { type: 'reasoning', reasoning: 'thinking', signature: null, redacted: false },
              { type: 'text', text: 'answer', refusal: null },
              { type: 'image' },
            ],
          },
        ],
      };
      expect(parseTranscript(transcript).ok).toBe(true);
    });

    it('accepts assistant tool calls with and without a view', () => {
      const transcript: Transcript = {
        ...minimal,
        messages: [
          {
            role: 'assistant',
            content: '',
            tool_calls: [
              { id: 'c1', function: 'bash', type: 'function', view: { content: 'ls', format: 'markdown' } },
              { id: 'c2', function: 'read', type: 'function', arguments: { path: 'a.txt', lines: [1, 2] } },
            ],
          },
        ],
      };
      expect(parseTranscript(transcript).ok).toBe(true);
    });

    it('accepts tool messages with call id, function, and error', () => {
      const transcript: Transcript = {
        ...minimal,
        messages: [
          {
            role: 'tool',
            content: 'boom',
            tool_call_id: 'c1',
            function: 'bash',
            error: { type: 'runtime', message: 'exit 1' },
          },
        ],
      };
      expect(parseTranscript(transcript).ok).toBe(true);
    });

    it('accepts nested metadata on the transcript and on messages', () => {
      const transcript: Transcript = {
        ...minimal,
        name: 'run',
        created_at: '2026-09-25T00:00:00Z',
        transcript_group_id: null,
        metadata: { model: 'x', tags: ['a', 'b'], usage: { input: 1, output: 2 } },
        messages: [{ role: 'user', content: '{bad json', metadata: { raw: true } }],
      };
      expect(parseTranscript(transcript).ok).toBe(true);
    });

    it('keeps keys it does not know about', () => {
      const transcript = { ...minimal, messages: [{ role: 'assistant', content: 'x', citations: [] }] };
      const result = parseTranscript(transcript);
      expect(result.ok && result.transcript).toBe(transcript);
    });
  });

  describe('a value that is not a transcript', () => {
    it.each([
      ['a string', 'nope'],
      ['null', null],
      ['a number', 3],
      ['an empty object', {}],
      ['missing id', { messages: [], metadata: {} }],
      ['missing messages', { id: 't1', metadata: {} }],
      ['missing metadata', { id: 't1', messages: [] }],
      ['a non-string name', { ...minimal, name: 3 }],
      ['a non-array messages', { ...minimal, messages: 'x' }],
      ['an unknown role', { ...minimal, messages: [{ role: 'robot', content: 'x' }] }],
      ['content of the wrong type', { ...minimal, messages: [{ role: 'user', content: 3 }] }],
      ['a content item of unknown type', { ...minimal, messages: [{ role: 'user', content: [{ type: 'audio' }] }] }],
      ['a tool call without an id', { ...minimal, messages: [{ role: 'assistant', content: '', tool_calls: [{ function: 'f', type: 'function' }] }] }],
      ['a tool error without a message', { ...minimal, messages: [{ role: 'tool', content: '', error: { type: 'x' } }] }],
      ['metadata nested too deep', { ...minimal, metadata: { a: { b: { c: 1 } } } }],
    ])('rejects %s', (_label, value) => {
      expect(parseTranscript(value).ok).toBe(false);
    });

    it('names the failing path in the error', () => {
      const result = parseTranscript({ ...minimal, messages: [{ role: 'user', content: 3 }] });
      expect(result.ok).toBe(false);
      expect(!result.ok && result.error).toContain('messages[0].content');
    });
  });
});
