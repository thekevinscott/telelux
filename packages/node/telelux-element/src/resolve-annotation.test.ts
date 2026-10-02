import { describe, expect, it } from 'vitest';

import type { AnnotationSidecar } from './annotations';
import { resolveAnnotation } from './resolve-annotation';

const sidecar: AnnotationSidecar = {
  version: 1,
  transcript_id: 't',
  annotations: [
    { id: 'a', target: { start: { index: 0 } }, label: 'x', source: { kind: 'judge' } },
    { id: 'b', target: { start: { index: 1 } }, label: 'y', source: { kind: 'judge' }, resolution: { state: 'rejected', by: 'k' } },
  ],
};

describe('resolveAnnotation', () => {
  it('records the state, reviewer, note, and time on the named annotation', () => {
    const next = resolveAnnotation(sidecar, 'a', { state: 'confirmed', by: 'kevin', note: 'clear case', at: '2026-10-02T00:00:00Z' });
    expect(next.annotations[0].resolution).toEqual({ state: 'confirmed', by: 'kevin', note: 'clear case', at: '2026-10-02T00:00:00Z' });
    expect(next.annotations[1]).toBe(sidecar.annotations[1]);
    expect(next.transcript_id).toBe('t');
  });

  it('leaves out a blank reviewer or note', () => {
    const next = resolveAnnotation(sidecar, 'a', { state: 'rejected', by: ' ', note: '', at: 'now' });
    expect(next.annotations[0].resolution).toEqual({ state: 'rejected', at: 'now' });
  });

  it('trims the reviewer and note', () => {
    const next = resolveAnnotation(sidecar, 'a', { state: 'confirmed', by: ' kevin ', note: ' clear\n', at: 'now' });
    expect(next.annotations[0].resolution).toEqual({ state: 'confirmed', by: 'kevin', note: 'clear', at: 'now' });
  });

  it('reopens an annotation by removing its resolution', () => {
    const next = resolveAnnotation(sidecar, 'b', { state: undefined, at: 'now' });
    expect(next.annotations[1]).not.toHaveProperty('resolution');
    expect(next.annotations[1].label).toBe('y');
  });

  it('never changes the sidecar it was given', () => {
    const before = structuredClone(sidecar);
    resolveAnnotation(sidecar, 'a', { state: 'confirmed', at: 'now' });
    resolveAnnotation(sidecar, 'b', { state: undefined, at: 'now' });
    expect(sidecar).toEqual(before);
  });

  it('returns an equal sidecar for an unknown id', () => {
    expect(resolveAnnotation(sidecar, 'zzz', { state: 'confirmed', at: 'now' })).toEqual(sidecar);
  });
});
