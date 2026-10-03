import { parseAnnotations } from 'telelux-element/parse';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readSidecar } from './read-sidecar';

vi.mock('telelux-element/parse', async () => {
  const actual = await vi.importActual<typeof import('telelux-element/parse')>('telelux-element/parse');
  const parseAnnotations: typeof actual.parseAnnotations = (value) =>
    value === 'bad'
      ? { ok: false, error: '✖ Invalid input\n  → at version' }
      : { ok: true, annotations: { version: 1, annotations: [] } };
  return { ...actual, parseAnnotations: vi.fn(parseAnnotations) };
});

beforeEach(() => {
  vi.mocked(parseAnnotations).mockClear();
});

describe('readSidecar', () => {
  it('parses the text as JSON and returns the sidecar the schema accepts', () => {
    expect(readSidecar('{"version":1,"annotations":[]}', 'a.json')).toStrictEqual({
      ok: true,
      annotations: { version: 1, annotations: [] },
    });
    expect(parseAnnotations).toHaveBeenCalledWith({ version: 1, annotations: [] });
  });

  it('names the file and the JSON error when the text is not JSON', () => {
    const result = readSidecar('{"version":', 'a.json');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toMatch(/^a\.json is not valid JSON: \S/);
    expect(parseAnnotations).not.toHaveBeenCalled();
  });

  it('names the file and lists the schema reasons when the JSON is not an annotations sidecar', () => {
    expect(readSidecar('"bad"', 'a.json')).toStrictEqual({
      ok: false,
      error: 'a.json is not an annotations file:\n✖ Invalid input\n  → at version',
    });
  });
});
