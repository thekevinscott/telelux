import { parseJsonObject } from '../parse-json-object';
import { isRecord } from './records';

export function sniffClaudeCode(text: string): boolean {
  const markers = ['sessionId', 'uuid', 'message', 'timestamp'];
  const first = text.split(/\r?\n/).find((line) => line.trim() !== '');
  const record = first && parseJsonObject(first);
  return isRecord(record) && typeof record.type === 'string' && markers.some((key) => key in record);
}
