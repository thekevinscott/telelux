import { describe, expect, it, vi } from 'vitest';

import { type Annotation, type AnnotationSidecar, parseAnnotations } from './annotations';

vi.mock('./sidecar-schema', async () => {
  const actual = await vi.importActual<typeof import('./sidecar-schema')>('./sidecar-schema');
  return { ...actual, sidecarSchema: vi.fn(actual.sidecarSchema) };
});

const annotation: Annotation = {
  id: 'a1',
  target: { start: { uuid: 'u1' } },
  label: 'test-tampering',
  source: { kind: 'judge' },
};

const sidecar = (...annotations: unknown[]) => ({ version: 1, annotations });

const failure = (value: unknown) => {
  const result = parseAnnotations(value);
  return result.ok ? undefined : result.error;
};

describe('parseAnnotations', () => {
  describe('a sidecar in the expected shape', () => {
    it('accepts the minimal shape and returns the same object', () => {
      const value: AnnotationSidecar = { version: 1, annotations: [] };
      const result = parseAnnotations(value);
      expect(result).toEqual({ ok: true, annotations: value });
      expect(result.ok && result.annotations).toBe(value);
    });

    it('accepts a minimal annotation', () => {
      expect(parseAnnotations(sidecar(annotation)).ok).toBe(true);
    });

    it('accepts every optional field', () => {
      const full: AnnotationSidecar = {
        version: 1,
        transcript_id: 'session-1',
        annotations: [
          {
            id: 'a1',
            target: { start: { uuid: 'u1', index: 3 }, end: { tool_call_id: 'toolu_9' } },
            label: 'phase',
            summary: 'Read the reference implementation',
            note: 'Long exploration before any edit.',
            confidence: 0.75,
            source: { kind: 'model', name: 'event-extractor' },
            resolution: { state: 'rejected', by: 'kevin', note: 'Fine as is.', at: '2026-10-02T12:00:00Z' },
            created_at: '2026-10-01T09:00:00Z',
            metadata: { rubric: 'r1', score: 2, tags: ['x'] },
          },
        ],
      };
      expect(parseAnnotations(full).ok).toBe(true);
    });

    it('accepts each source kind and resolution state', () => {
      for (const kind of ['human', 'judge', 'model']) {
        expect(parseAnnotations(sidecar({ ...annotation, source: { kind } })).ok).toBe(true);
      }
      for (const state of ['confirmed', 'rejected']) {
        expect(parseAnnotations(sidecar({ ...annotation, resolution: { state } })).ok).toBe(true);
      }
    });

    it('accepts confidence at both ends of the range', () => {
      expect(parseAnnotations(sidecar({ ...annotation, confidence: 0 })).ok).toBe(true);
      expect(parseAnnotations(sidecar({ ...annotation, confidence: 1 })).ok).toBe(true);
    });

    it('keeps keys it does not know about', () => {
      const value = { ...sidecar({ ...annotation, rubric_item: 7 }), producer: 'judge-v2' };
      const result = parseAnnotations(value);
      expect(result.ok && result.annotations).toBe(value);
      expect(result.ok && result.annotations.annotations[0]).toHaveProperty('rubric_item', 7);
    });
  });

  describe('a sidecar that does not match', () => {
    it.each([undefined, null, 'text', 42, []])('rejects %j', (value) => {
      expect(parseAnnotations(value).ok).toBe(false);
    });

    it('rejects an unknown version', () => {
      expect(failure({ version: 2, annotations: [] })).toContain('version');
    });

    it('rejects a missing annotations list', () => {
      expect(failure({ version: 1 })).toContain('annotations');
    });

    it('requires an id, a target, a label, and a source', () => {
      for (const key of ['id', 'target', 'label', 'source'] as const) {
        const rest: Record<string, unknown> = { ...annotation };
        delete rest[key];
        expect(failure(sidecar(rest))).toContain(key);
      }
    });

    it('rejects an empty id or label', () => {
      expect(failure(sidecar({ ...annotation, id: '' }))).toContain('id');
      expect(failure(sidecar({ ...annotation, label: '' }))).toContain('label');
    });

    it('rejects an anchor with no identity', () => {
      expect(failure(sidecar({ ...annotation, target: { start: {} } }))).toBe('✖ An anchor needs a uuid, tool_call_id, or index.\n  → at annotations[0].target.start');
      expect(failure(sidecar({ ...annotation, target: { start: { uuid: 'u1' }, end: {} } }))).toContain('target.end');
    });

    it('accepts any non-empty uuid or tool_call_id and rejects an empty one', () => {
      expect(parseAnnotations(sidecar({ ...annotation, target: { start: { uuid: 'u', tool_call_id: 'toolu_01abc' } } })).ok).toBe(true);
      expect(failure(sidecar({ ...annotation, target: { start: { uuid: '' } } }))).toContain('uuid');
      expect(failure(sidecar({ ...annotation, target: { start: { tool_call_id: '' } } }))).toContain('tool_call_id');
    });

    it('accepts an anchor with only one identity', () => {
      for (const start of [{ uuid: 'u' }, { tool_call_id: 'c' }, { index: 0 }]) {
        expect(parseAnnotations(sidecar({ ...annotation, target: { start } })).ok).toBe(true);
      }
    });

    it('accepts a one-character id and label', () => {
      expect(parseAnnotations(sidecar({ ...annotation, id: 'ab', label: 'xy' })).ok).toBe(true);
      expect(parseAnnotations(sidecar({ ...annotation, id: 'a', label: 'x' })).ok).toBe(true);
    });

    it('rejects fields of the wrong type', () => {
      for (const field of ['summary', 'note', 'created_at']) {
        expect(failure(sidecar({ ...annotation, [field]: 1 }))).toContain(field);
      }
      expect(failure(sidecar({ ...annotation, source: { kind: 'human', name: 1 } }))).toContain('source.name');
      for (const field of ['by', 'note', 'at']) {
        expect(failure(sidecar({ ...annotation, resolution: { state: 'confirmed', [field]: 1 } }))).toContain(`resolution.${field}`);
      }
      expect(failure(sidecar({ ...annotation, metadata: 'x' }))).toContain('metadata');
      expect(failure({ version: 1, transcript_id: 1, annotations: [] })).toContain('transcript_id');
      expect(failure(sidecar({ ...annotation, target: { start: { index: 0 }, end: 'x' } }))).toContain('target.end');
    });

    it('rejects an index that is negative or fractional', () => {
      expect(failure(sidecar({ ...annotation, target: { start: { index: -1 } } }))).toContain('index');
      expect(failure(sidecar({ ...annotation, target: { start: { index: 1.5 } } }))).toContain('index');
    });

    it('rejects confidence outside 0 to 1', () => {
      expect(failure(sidecar({ ...annotation, confidence: -0.1 }))).toContain('confidence');
      expect(failure(sidecar({ ...annotation, confidence: 1.1 }))).toContain('confidence');
    });

    it('rejects an unknown source kind or resolution state', () => {
      expect(failure(sidecar({ ...annotation, source: { kind: 'robot' } }))).toContain('source.kind');
      expect(failure(sidecar({ ...annotation, resolution: { state: 'open' } }))).toContain('resolution.state');
    });

    it('rejects two annotations with the same id', () => {
      expect(failure(sidecar(annotation, { ...annotation }))).toContain('Duplicate annotation id "a1"');
    });
  });
});
