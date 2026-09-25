import { describe, expect, it } from 'vitest';

import { messageText } from './message-text';

describe('messageText', () => {
  it('returns string content as is', () => {
    expect(messageText('hello')).toBe('hello');
  });

  it('joins the text items of a Content[] with newlines', () => {
    expect(messageText([
      { type: 'text', text: 'one' },
      { type: 'text', text: 'two' },
    ])).toBe('one\ntwo');
  });

  it('skips reasoning and image items', () => {
    expect(messageText([
      { type: 'reasoning', reasoning: 'hmm' },
      { type: 'image' },
      { type: 'text', text: 'only' },
    ])).toBe('only');
  });

  it('treats a text item without text as empty', () => {
    expect(messageText([{ type: 'text' }, { type: 'text', text: 'b' }])).toBe('\nb');
  });

  it('returns an empty string for an empty Content[]', () => {
    expect(messageText([])).toBe('');
  });
});
