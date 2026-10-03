import { describe, expect, it, vi } from 'vitest';

import { matchesFilter } from './annotation-filter';
import type { Annotation } from './annotations';

vi.mock('./annotation-labels', async () => {
  const actual = await vi.importActual<typeof import('./annotation-labels')>('./annotation-labels');
  return { ...actual, sourceName: vi.fn(actual.sourceName), annotationStatus: vi.fn(actual.annotationStatus) };
});

const annotation: Annotation = {
  id: 'a',
  target: { start: { index: 0 } },
  label: 'cheating',
  source: { kind: 'judge', name: 'j1' },
};

describe('matchesFilter', () => {
  it('matches everything with an empty filter', () => {
    expect(matchesFilter(annotation, {})).toBe(true);
  });

  it('matches on the label', () => {
    expect(matchesFilter(annotation, { label: 'cheating' })).toBe(true);
    expect(matchesFilter(annotation, { label: 'other' })).toBe(false);
  });

  it('matches on the source name', () => {
    expect(matchesFilter(annotation, { source: 'judge: j1' })).toBe(true);
    expect(matchesFilter(annotation, { source: 'judge' })).toBe(false);
  });

  it('matches on the resolution status', () => {
    expect(matchesFilter(annotation, { status: 'unresolved' })).toBe(true);
    expect(matchesFilter(annotation, { status: 'confirmed' })).toBe(false);
    expect(matchesFilter({ ...annotation, resolution: { state: 'confirmed' } }, { status: 'confirmed' })).toBe(true);
  });

  it('requires every set criterion to match', () => {
    expect(matchesFilter(annotation, { label: 'cheating', source: 'judge: j1', status: 'unresolved' })).toBe(true);
    expect(matchesFilter(annotation, { label: 'cheating', source: 'judge: j1', status: 'rejected' })).toBe(false);
    expect(matchesFilter(annotation, { label: 'cheating', source: 'human', status: 'unresolved' })).toBe(false);
    expect(matchesFilter(annotation, { label: 'x', source: 'judge: j1', status: 'unresolved' })).toBe(false);
  });
});
