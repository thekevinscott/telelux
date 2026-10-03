import { describe, expect, it } from 'vitest';

import { parseAnnotations, parseRawTranscript, resolveAnnotations } from './parse';

describe('parse', () => {
  it('exposes parseRawTranscript as the Lit-free entry', () => {
    expect(parseRawTranscript).toBeTypeOf('function');
  });

  it('exposes the annotation sidecar helpers without Lit', () => {
    expect(parseAnnotations).toBeTypeOf('function');
    expect(resolveAnnotations).toBeTypeOf('function');
  });
});
