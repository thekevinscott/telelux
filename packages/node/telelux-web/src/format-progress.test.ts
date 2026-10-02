import { describe, expect, it } from 'vitest';

import { formatProgress } from './format-progress';

describe('formatProgress', () => {
  it('shows received and total in MiB', () => {
    expect(formatProgress(512 * 1024, 2 * 1024 * 1024)).toBe('0.5 of 2.0 MiB');
  });

  it('shows only what was received when the total is unknown', () => {
    expect(formatProgress(3 * 1024 * 1024, undefined)).toBe('3.0 MiB');
  });
});
