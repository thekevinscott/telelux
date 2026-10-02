import { describe, expect, it, vi } from 'vitest';

import type { Annotation } from './annotations';
import { resolveAnnotations } from './resolve-annotations';
import type { ChatMessage } from './transcript';

vi.mock('./resolve-anchor', async () => {
  const actual = await vi.importActual<typeof import('./resolve-anchor')>('./resolve-anchor');
  const resolveAnchor = vi.fn<typeof actual.resolveAnchor>((messages, anchor) =>
    anchor.index !== undefined && anchor.index < messages.length ? anchor.index : undefined,
  );
  return { ...actual, resolveAnchor };
});

const messages: ChatMessage[] = ['a', 'b', 'c', 'd'].map((content) => ({ role: 'user', content }));

const note = (id: string, start: number, end?: number): Annotation => ({
  id,
  target: { start: { index: start }, ...(end === undefined ? {} : { end: { index: end } }) },
  label: id,
  source: { kind: 'human' },
});

describe('resolveAnnotations', () => {
  it('anchors a single-message annotation at its start', () => {
    const a = note('a', 2);
    expect(resolveAnnotations(messages, [a])).toEqual({ anchored: [{ annotation: a, start: 2, end: 2 }], unanchored: [] });
  });

  it('anchors a span from its start to its end', () => {
    const a = note('a', 1, 3);
    expect(resolveAnnotations(messages, [a]).anchored).toEqual([{ annotation: a, start: 1, end: 3 }]);
  });

  it('keeps an annotation whose start resolves nowhere, with the reason', () => {
    const a = note('a', 9);
    expect(resolveAnnotations(messages, [a])).toEqual({
      anchored: [],
      unanchored: [{ annotation: a, reason: 'The start anchor matches no message.' }],
    });
  });

  it('keeps an annotation whose end resolves nowhere, with the reason', () => {
    const a = note('a', 1, 9);
    expect(resolveAnnotations(messages, [a]).unanchored).toEqual([{ annotation: a, reason: 'The end anchor matches no message.' }]);
  });

  it('keeps an annotation whose end comes before its start, with the reason', () => {
    const a = note('a', 3, 1);
    expect(resolveAnnotations(messages, [a]).unanchored).toEqual([{ annotation: a, reason: 'The end anchor comes before the start anchor.' }]);
  });

  it('keeps the sidecar order within each list', () => {
    const list = [note('x', 3), note('gone', 7), note('y', 0), note('lost', 8)];
    const { anchored, unanchored } = resolveAnnotations(messages, list);
    expect(anchored.map(({ annotation }) => annotation.id)).toEqual(['x', 'y']);
    expect(unanchored.map(({ annotation }) => annotation.id)).toEqual(['gone', 'lost']);
  });
});
