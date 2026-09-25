import { parseJsonObject } from '../parse-json-object';

export function sniffClaudeCode(text: string): boolean {
  const markers = ['sessionId', 'uuid', 'message', 'timestamp'];
  const first = text.split(/\r?\n/).find((line) => line.trim() !== '');
  const record = parseJsonObject(first ?? '');
  return record !== undefined && typeof record.type === 'string' && markers.some((key) => key in record);
}
