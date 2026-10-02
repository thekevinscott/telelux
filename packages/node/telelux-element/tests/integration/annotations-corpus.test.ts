import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { parseAnnotations, parseRawTranscript, resolveAnnotations } from '../../src/parse';

const sample = readFileSync(fileURLToPath(new URL('../../../../../fixtures/claude-code/sample.jsonl', import.meta.url)), 'utf8');

const uuids = sample
  .split('\n')
  .filter((line) => line.trim() !== '')
  .flatMap((line) => {
    try {
      const { uuid } = JSON.parse(line) as { uuid?: unknown };
      return typeof uuid === 'string' ? [uuid] : [];
    } catch {
      return [];
    }
  });

test.describe('annotations over the shared fixture corpus', () => {
  test('anchors an annotation on every record uuid in the file, merged records included', () => {
    const parsed = parseRawTranscript(sample);
    expect(parsed.ok).toBe(true);
    const messages = parsed.ok ? parsed.transcript.messages : [];
    expect(messages.some(({ metadata }) => Array.isArray(metadata?.mergedUuids))).toBe(true);
    const sidecar = {
      version: 1,
      annotations: uuids.map((uuid) => ({ id: uuid, target: { start: { uuid } }, label: 'record', source: { kind: 'judge' } })),
    };
    const result = parseAnnotations(sidecar);
    expect(result.ok).toBe(true);
    const { anchored, unanchored } = resolveAnnotations(messages, result.ok ? result.annotations.annotations : []);
    expect(unanchored).toEqual([]);
    expect(anchored).toHaveLength(uuids.length);
  });
});
