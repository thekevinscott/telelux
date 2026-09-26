import { describe, expect, it, vi } from 'vitest';

import { MAX_TEXT_LENGTH } from './limits';
import { parseRawTranscript } from './parse-raw-transcript';
import type { Transcript } from './transcript';

const parsed: Transcript = { id: 'alpha', messages: [], metadata: {} };

vi.mock('./limits', async () => {
  const actual = await vi.importActual<typeof import('./limits')>('./limits');
  return { ...actual, MAX_TEXT_LENGTH: 1024 * 1024 };
});

vi.mock('./detect-format', async () => {
  const actual = await vi.importActual<typeof import('./detect-format')>('./detect-format');
  const detectFormat: typeof actual.detectFormat = (text) => (text.startsWith('alpha') ? 'claude-code' : undefined);
  return { ...actual, detectFormat };
});

vi.mock('./formats', async () => {
  const actual = await vi.importActual<typeof import('./formats')>('./formats');
  const formats = {
    'claude-code': { sniff: () => true, parse: (text: string) => ({ ok: true as const, transcript: { ...parsed, name: text } }) },
    other: { sniff: () => false, parse: () => ({ ok: false as const, error: 'unused' }) },
  };
  return { ...actual, formats };
});

describe('parseRawTranscript', () => {
  it('parses with the named format', () => {
    expect(parseRawTranscript('zeta', { format: 'claude-code' })).toEqual({ ok: true, transcript: { ...parsed, name: 'zeta' } });
  });

  it('detects the format when none is named', () => {
    expect(parseRawTranscript('alpha text')).toEqual({ ok: true, transcript: { ...parsed, name: 'alpha text' } });
  });

  it('fails when no format is named and none is detected', () => {
    const result = parseRawTranscript('zeta');
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain('Could not detect');
  });

  it('fails on an unknown format name and lists the known ones', () => {
    const result = parseRawTranscript('alpha', { format: 'nope' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain('"nope"');
    expect(!result.ok && result.error).toContain('Known formats: claude-code, other.');
  });

  it('fails on text over the size limit without parsing it', () => {
    const result = parseRawTranscript('a'.repeat(MAX_TEXT_LENGTH + 1), { format: 'claude-code' });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain('the limit is 1.0 MiB');
  });

  it('accepts text exactly at the size limit', () => {
    expect(parseRawTranscript('a'.repeat(MAX_TEXT_LENGTH), { format: 'claude-code' }).ok).toBe(true);
  });
});
