import { describe, expect, it } from 'vitest';

import { formatCreatedAt } from './format-created-at';

describe('formatCreatedAt', () => {
  it('formats a timestamp in the local time zone and locale', () => {
    const value = '2026-09-09T00:14:29.195Z';
    expect(formatCreatedAt(value)).toBe(new Date(value).toLocaleString());
  });

  it('returns an unparseable value as given', () => {
    expect(formatCreatedAt('last Tuesday')).toBe('last Tuesday');
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['empty', ''],
    ['blank', ' '],
  ])('returns undefined for a %s value', (_label, value) => {
    expect(formatCreatedAt(value)).toBeUndefined();
  });
});
