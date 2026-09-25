import { detectFormat } from './detect-format';
import { type FormatAdapter, formats } from './formats';
import { MAX_TEXT_LENGTH } from './limits';
import type { ParseResult } from './transcript';

export type ParseRawOptions = { format?: string };

function mib(length: number): string {
  return (length / (1024 * 1024)).toFixed(1);
}

export function parseRawTranscript(text: string, options: ParseRawOptions = {}): ParseResult {
  if (text.length > MAX_TEXT_LENGTH) {
    return { ok: false, error: `The transcript is ${mib(text.length)} MiB of text; the limit is ${mib(MAX_TEXT_LENGTH)} MiB.` };
  }
  const name = options.format ?? detectFormat(text);
  if (name === undefined) {
    return { ok: false, error: 'Could not detect the transcript format. Name it with the format option.' };
  }
  const adapter = (formats as Record<string, FormatAdapter | undefined>)[name];
  if (adapter === undefined) {
    return { ok: false, error: `Unknown transcript format "${name}". Known formats: ${Object.keys(formats).join(', ')}.` };
  }
  return adapter.parse(text);
}
