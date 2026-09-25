import { parseJsonObject } from '../parse-json-object';

const markers = ['sessionId', 'uuid', 'message', 'timestamp'];

export function sniffClaudeCode(text: string): boolean {
  const first = text.split(/\r?\n/).find((line) => line.trim() !== '');
  const record = first === undefined ? undefined : parseJsonObject(first);
  return record !== undefined && typeof record.type === 'string' && markers.some((key) => key in record);
}
