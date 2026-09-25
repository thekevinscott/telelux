import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { parseRawTranscript } from '../../src/parse';
import { parseTranscript } from '../../src/transcript';

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`../../../../../fixtures/claude-code/${name}`, import.meta.url)), 'utf8');

test.describe('the claude-code parser over the shared fixture corpus', () => {
  test('produces the recorded reference transcript', () => {
    expect(parseRawTranscript(fixture('sample.jsonl'))).toEqual({
      ok: true,
      transcript: JSON.parse(fixture('sample.transcript.json')),
    });
  });

  test('produces a transcript the element accepts', () => {
    const result = parseRawTranscript(fixture('sample.jsonl'));
    expect(result.ok && parseTranscript(result.transcript).ok).toBe(true);
  });
});
