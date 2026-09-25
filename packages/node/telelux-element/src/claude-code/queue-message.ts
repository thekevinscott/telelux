import type { ChatMessage } from '../transcript';
import { recordMetadata } from './record-metadata';
import { type Block, str } from './records';

export function queueMessage(record: Block): ChatMessage {
  const operation = str(record.operation);
  const metadata = { ...recordMetadata(record), operation };
  return operation === 'enqueue'
    ? { role: 'user', content: str(record.content), metadata }
    : { role: 'system', content: `queue ${operation}`, metadata };
}
