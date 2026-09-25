import { parseJsonObject } from './parse-json-object';

export type JsonlLine = { line: string; record: Record<string, unknown> | undefined };

export function splitJsonl(text: string): JsonlLine[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => ({ line, record: parseJsonObject(line) }));
}
