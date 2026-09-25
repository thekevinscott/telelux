import { describe, expect, it } from 'vitest';

import { sniffClaudeCode } from './sniff';

describe('sniffClaudeCode', () => {
  it.each([
    ['a record with a sessionId', '{"type":"queue-operation","sessionId":"s"}'],
    ['a record with a uuid', '{"type":"attachment","uuid":"u"}'],
    ['a record with a message', '{"type":"user","message":{}}'],
    ['a record with a timestamp', '{"type":"x","timestamp":"t"}'],
  ])('accepts a first line that is %s', (_label, line) => {
    expect(sniffClaudeCode(line)).toBe(true);
  });

  it('skips leading blank lines', () => {
    expect(sniffClaudeCode('\n  \r\n{"type":"user","uuid":"u"}')).toBe(true);
  });

  it.each([
    ['empty text', ''],
    ['a malformed first line', 'nope\n{"type":"user","uuid":"u"}'],
    ['a record without a type', '{"uuid":"u"}'],
    ['a record with a non-string type', '{"type":1,"uuid":"u"}'],
    ['a record without any marker', '{"type":"user"}'],
    ['a JSON array', '[{"type":"user","uuid":"u"}]'],
  ])('rejects %s', (_label, text) => {
    expect(sniffClaudeCode(text)).toBe(false);
  });
});
