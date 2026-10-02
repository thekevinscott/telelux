import { describe, expect, it } from 'vitest';

import { standaloneName } from './standalone-name';

describe('standaloneName', () => {
  it('swaps the source file extension for .html', () => {
    expect(standaloneName('session.jsonl')).toBe('session.html');
    expect(standaloneName('my.session.log')).toBe('my.session.html');
  });

  it('appends .html to a name with no extension', () => {
    expect(standaloneName('session')).toBe('session.html');
    expect(standaloneName('.jsonl')).toBe('.jsonl.html');
  });

  it('falls back to transcript.html for an unnamed file', () => {
    expect(standaloneName('')).toBe('transcript.html');
  });
});
