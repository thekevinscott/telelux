import { describe, expect, it } from 'vitest';

import { reasoningText } from './reasoning-text';

describe('reasoningText', () => {
  it('returns undefined for string content', () => {
    expect(reasoningText('hello')).toBeUndefined();
  });

  it('returns the first reasoning item', () => {
    expect(reasoningText([
      { type: 'text', text: 'answer' },
      { type: 'reasoning', reasoning: 'first' },
      { type: 'reasoning', reasoning: 'second' },
    ])).toBe('first');
  });

  it('skips a reasoning item without reasoning text', () => {
    expect(reasoningText([{ type: 'reasoning' }, { type: 'reasoning', reasoning: 'kept' }])).toBe('kept');
  });

  it('keeps an empty reasoning string', () => {
    expect(reasoningText([{ type: 'reasoning', reasoning: '' }])).toBe('');
  });

  it('ignores a text item that carries a reasoning field', () => {
    expect(reasoningText([{ type: 'text', reasoning: 'stray' }])).toBeUndefined();
  });

  it('returns undefined when no item is reasoning', () => {
    expect(reasoningText([{ type: 'text', text: 'only' }])).toBeUndefined();
  });
});
