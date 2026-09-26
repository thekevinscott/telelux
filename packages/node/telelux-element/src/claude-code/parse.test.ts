import { describe, expect, it, vi } from 'vitest';

import { MAX_RECORDS } from '../limits';
import { parseClaudeCode } from './parse';

vi.mock('../limits', async () => {
  const actual = await vi.importActual<typeof import('../limits')>('../limits');
  return { ...actual, MAX_RECORDS: 3 };
});

const record = (value: Record<string, unknown>) => JSON.stringify(value);

const chunk = (id: string, content: Record<string, unknown>[]) =>
  record({ type: 'assistant', sessionId: 's1', message: { id, content, usage: { input_tokens: 1, output_tokens: 2 } } });

describe('parseClaudeCode', () => {
  it('builds the header and one message per record in order', () => {
    const text = [
      record({ type: 'user', sessionId: 's1', timestamp: 't1', message: { content: 'hi' } }),
      '',
      'oops',
      record({ type: 'assistant', sessionId: 's1', message: { id: 'm1', content: 'hello' } }),
    ].join('\n');
    const result = parseClaudeCode(text);
    expect(result).toEqual({
      ok: true,
      transcript: {
        id: 's1',
        created_at: 't1',
        metadata: {
          format: 'claude-code',
          sessionId: 's1',
          records: 3,
          usage: { input_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 0 },
        },
        messages: [
          { role: 'user', content: 'hi', metadata: { type: 'user', timestamp: 't1' } },
          { role: 'system', content: 'oops', metadata: { raw: true } },
          { role: 'assistant', content: 'hello', metadata: { type: 'assistant', messageId: 'm1' } },
        ],
      },
    });
  });

  it('merges consecutive assistant records that share a message id and counts their usage once', () => {
    const text = [
      chunk('m1', [{ type: 'text', text: 'one' }]),
      chunk('m1', [{ type: 'tool_use', id: 'c1', name: 'Bash', input: {} }]),
      chunk('m2', [{ type: 'text', text: 'two' }]),
    ].join('\n');
    const result = parseClaudeCode(text);
    const messages = result.ok ? result.transcript.messages : [];
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({
      content: [{ type: 'text', text: 'one' }],
      tool_calls: [{ id: 'c1', function: 'Bash' }],
    });
    expect(result.ok && result.transcript.metadata.usage).toEqual({
      input_tokens: 2,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      output_tokens: 4,
    });
  });

  it('does not merge assistant chunks separated by another message', () => {
    const text = [
      chunk('m1', [{ type: 'text', text: 'one' }]),
      record({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'c1', content: 'r' }] } }),
      chunk('m1', [{ type: 'text', text: 'two' }]),
    ].join('\n');
    const result = parseClaudeCode(text);
    expect(result.ok && result.transcript.messages.map((message) => message.role)).toEqual(['assistant', 'tool', 'assistant']);
  });

  it('names tool messages after the assistant call they answer', () => {
    const text = [
      chunk('m1', [{ type: 'tool_use', id: 'c1', name: 'Read', input: { path: 'a' } }]),
      record({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 'c1', content: 'r' }] } }),
    ].join('\n');
    const result = parseClaudeCode(text);
    expect(result.ok && result.transcript.messages[1]).toMatchObject({ role: 'tool', tool_call_id: 'c1', function: 'Read' });
  });

  it('parses empty text to a transcript with no messages', () => {
    const result = parseClaudeCode('\n\n');
    expect(result.ok && result.transcript.messages).toEqual([]);
    expect(result.ok && result.transcript.metadata.records).toBe(0);
  });

  it('fails past the record limit instead of truncating', () => {
    const result = parseClaudeCode(`${record({ type: 'user' })}\n`.repeat(MAX_RECORDS + 1));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain(`${MAX_RECORDS + 1} records`);
  });

  it('accepts exactly the record limit', () => {
    expect(parseClaudeCode(`${record({ type: 'user' })}\n`.repeat(MAX_RECORDS)).ok).toBe(true);
  });
});
