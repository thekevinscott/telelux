import type { JsonlLine } from '../split-jsonl';
import type { ChatMessage } from '../transcript';
import { assistantMessage } from './assistant-message';
import { attachmentMessage } from './attachment-message';
import { queueMessage } from './queue-message';
import { recordMetadata } from './record-metadata';
import { str } from './records';
import { resultMessage } from './result-message';
import { systemMessage } from './system-message';
import { userMessages } from './user-messages';

export function lineMessages({ line, record }: JsonlLine, toolNames: Map<string, string>): ChatMessage[] {
  if (record === undefined) {
    return [{ role: 'system', content: line, metadata: { raw: true } }];
  }
  switch (record.type) {
    case 'user':
      return userMessages(record, toolNames);
    case 'assistant':
      return [assistantMessage(record, toolNames)];
    case 'queue-operation':
      return [queueMessage(record)];
    case 'attachment':
      return [attachmentMessage(record)];
    case 'system':
      return [systemMessage(record)];
    case 'result':
      return [resultMessage(record)];
    case 'atis-latch':
      return [{ role: 'system', content: 'session latch', metadata: recordMetadata(record) }];
    case 'last-prompt':
      return [{ role: 'system', content: str(record.lastPrompt), metadata: recordMetadata(record) }];
    case 'ai-title':
      return [{ role: 'system', content: str(record.aiTitle), metadata: recordMetadata(record) }];
    case 'custom-title':
      return [{ role: 'system', content: str(record.customTitle), metadata: recordMetadata(record) }];
    default:
      return [{ role: 'system', content: line, metadata: { ...recordMetadata(record), unknown: true } }];
  }
}
