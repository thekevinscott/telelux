import type { ChatMessage } from '../transcript';
import { recordMetadata } from './record-metadata';
import { type Block, str } from './records';

export function systemMessage(record: Block): ChatMessage {
  const subtype = str(record.subtype);
  const metadata = recordMetadata(record);
  if (subtype !== '') {
    metadata.subtype = subtype;
  }
  if (typeof record.level === 'string') {
    metadata.level = record.level;
  }
  return { role: 'system', content: typeof record.content === 'string' ? record.content : subtype, metadata };
}
