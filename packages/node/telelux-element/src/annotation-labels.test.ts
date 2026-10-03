import { describe, expect, it } from 'vitest';

import { annotationStatus, sourceName } from './annotation-labels';

describe('sourceName', () => {
  it('names the kind alone when the source has no name', () => {
    expect(sourceName({ kind: 'human' })).toBe('human');
  });

  it('adds the name after the kind', () => {
    expect(sourceName({ kind: 'judge', name: 'rubric-v2' })).toBe('judge: rubric-v2');
  });
});

describe('annotationStatus', () => {
  const base = { id: 'a', target: { start: { index: 0 } }, label: 'l', source: { kind: 'human' as const } };

  it('reads an annotation with no resolution as unresolved', () => {
    expect(annotationStatus(base)).toBe('unresolved');
  });

  it('reads the resolution state', () => {
    expect(annotationStatus({ ...base, resolution: { state: 'confirmed' } })).toBe('confirmed');
    expect(annotationStatus({ ...base, resolution: { state: 'rejected' } })).toBe('rejected');
  });
});
