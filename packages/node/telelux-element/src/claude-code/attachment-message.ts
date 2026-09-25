import type { ChatMessage } from '../transcript';
import { attachmentText } from './attachment-text';
import { recordMetadata } from './record-metadata';
import { asRecord, type Block, str } from './records';

export function attachmentMessage(record: Block): ChatMessage {
  const attachment = asRecord(record.attachment);
  return {
    role: 'system',
    content: attachmentText(attachment),
    metadata: { ...recordMetadata(record), attachment: str(attachment.type) },
  };
}
