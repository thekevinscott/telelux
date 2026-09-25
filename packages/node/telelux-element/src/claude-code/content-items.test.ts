import { describe, expect, it } from 'vitest';

import { contentItems } from './content-items';

describe('contentItems', () => {
  it('maps text blocks', () => {
    expect(contentItems([{ type: 'text', text: 'hi' }])).toEqual([{ type: 'text', text: 'hi' }]);
  });

  it('maps thinking blocks to reasoning with their signature', () => {
    expect(contentItems([{ type: 'thinking', thinking: 'hmm', signature: 'sig' }])).toEqual([
      { type: 'reasoning', reasoning: 'hmm', signature: 'sig' },
    ]);
  });

  it('omits the signature when the block has none', () => {
    expect(contentItems([{ type: 'thinking', thinking: 'hmm' }])).toEqual([{ type: 'reasoning', reasoning: 'hmm' }]);
  });

  it('maps redacted thinking to redacted reasoning', () => {
    expect(contentItems([{ type: 'redacted_thinking', data: 'x' }])).toEqual([{ type: 'reasoning', reasoning: '', redacted: true }]);
  });

  it('maps image blocks to an image item without the bytes', () => {
    expect(contentItems([{ type: 'image', source: { data: 'abc' } }])).toEqual([{ type: 'image' }]);
  });

  it('names an unknown block type as bracketed text', () => {
    expect(contentItems([{ type: 'tool_reference' }])).toEqual([{ type: 'text', text: '[tool_reference]' }]);
  });

  it('treats missing text as empty', () => {
    expect(contentItems([{ type: 'text' }])).toEqual([{ type: 'text', text: '' }]);
  });
});
