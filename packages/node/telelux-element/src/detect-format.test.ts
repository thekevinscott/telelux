import { describe, expect, it, vi } from 'vitest';

import { detectFormat } from './detect-format';

vi.mock('./formats', async () => {
  const actual = await vi.importActual<typeof import('./formats')>('./formats');
  const formats = {
    alpha: { sniff: (text: string) => text.startsWith('a'), parse: () => ({ ok: false as const, error: 'unused' }) },
    beta: { sniff: (text: string) => text.startsWith('b'), parse: () => ({ ok: false as const, error: 'unused' }) },
  };
  return { ...actual, formats };
});

describe('detectFormat', () => {
  it('returns the first format whose sniff accepts the text', () => {
    expect(detectFormat('beta text')).toBe('beta');
  });

  it('returns undefined when no format accepts the text', () => {
    expect(detectFormat('zeta')).toBeUndefined();
  });
});
