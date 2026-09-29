import { describe, expect, it } from 'vitest';

import { textSegments } from './text-segments';

describe('textSegments', () => {
  it('returns prose as a single segment, raw', () => {
    expect(textSegments('# Title\n\n- a *b*\n\nplain')).toEqual([{ code: false, text: '# Title\n\n- a *b*\n\nplain' }]);
  });

  it('splits out a fenced block, dropping the fences', () => {
    expect(textSegments('Run:\n\n```bash\nls -la\n```\nthen stop')).toEqual([
      { code: false, text: 'Run:\n\n' },
      { code: true, text: 'ls -la' },
      { code: false, text: 'then stop' },
    ]);
  });

  it('keeps adjacent fenced blocks apart', () => {
    expect(textSegments('```\na\n```\n```\nb\n```')).toEqual([
      { code: true, text: 'a' },
      { code: true, text: 'b' },
    ]);
  });

  it('leaves an indented block as prose', () => {
    expect(textSegments('intro\n\n    indented\n')).toEqual([{ code: false, text: 'intro\n\n    indented\n' }]);
  });

  it('returns no segments for empty text', () => {
    expect(textSegments('')).toEqual([]);
  });
});
