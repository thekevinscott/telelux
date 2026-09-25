import { describe, expect, it } from 'vitest';

import { parseRawTranscript } from './parse';

describe('parse', () => {
  it('exposes parseRawTranscript as the Lit-free entry', () => {
    expect(parseRawTranscript).toBeTypeOf('function');
  });
});
