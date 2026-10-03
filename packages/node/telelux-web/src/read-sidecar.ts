import { type AnnotationsResult, parseAnnotations } from 'telelux-element/parse';

export function readSidecar(text: string, name: string): AnnotationsResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return { ok: false, error: `${name} is not valid JSON: ${(error as Error).message}` };
  }
  const parsed = parseAnnotations(value);
  return parsed.ok ? parsed : { ok: false, error: `${name} is not an annotations file:\n${parsed.error}` };
}
