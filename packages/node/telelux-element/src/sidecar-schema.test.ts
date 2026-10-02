import { describe, expect, it } from 'vitest';

import { sidecarSchema } from './sidecar-schema';

const annotation = { id: 'a1', target: { start: { index: 0 } }, label: 'l', source: { kind: 'human' } };

describe('sidecarSchema', () => {
  it('accepts a minimal sidecar', () => {
    expect(sidecarSchema().safeParse({ version: 1, annotations: [annotation] }).success).toBe(true);
  });

  it('points a duplicate id at the later annotation', () => {
    const result = sidecarSchema().safeParse({ version: 1, annotations: [annotation, { ...annotation, label: 'other' }, annotation] });
    expect(result.success ? [] : result.error.issues.map(({ path, message }) => [path.join('.'), message])).toEqual([
      ['annotations.1.id', 'Duplicate annotation id "a1".'],
      ['annotations.2.id', 'Duplicate annotation id "a1".'],
    ]);
  });
});
