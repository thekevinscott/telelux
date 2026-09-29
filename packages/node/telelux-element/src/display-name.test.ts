import { describe, expect, it } from 'vitest';

import { displayName } from './display-name';

describe('displayName', () => {
  it('returns a set name unchanged', () => {
    expect(displayName(' Fix the build ')).toBe(' Fix the build ');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty', ''],
    ['blank', '  \n'],
  ])('returns undefined for a %s name', (_label, name) => {
    expect(displayName(name)).toBeUndefined();
  });
});
