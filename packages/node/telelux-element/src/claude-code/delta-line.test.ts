import { describe, expect, it } from 'vitest';

import { deltaLine } from './delta-line';

describe('deltaLine', () => {
  it('counts added and removed entries', () => {
    expect(deltaLine('deferred_tools_delta', { addedNames: ['a', 'b'], removedNames: ['c'] }, 'addedNames', 'removedNames')).toBe(
      'deferred_tools_delta +2 -1',
    );
  });

  it('omits a zero count', () => {
    expect(deltaLine('x', { addedNames: ['a'], removedNames: [] }, 'addedNames', 'removedNames')).toBe('x +1');
    expect(deltaLine('x', { removedNames: ['a'] }, 'addedNames', 'removedNames')).toBe('x -1');
  });

  it('returns only the subtype when nothing changed', () => {
    expect(deltaLine('x', {}, 'addedNames', 'removedNames')).toBe('x');
  });
});
