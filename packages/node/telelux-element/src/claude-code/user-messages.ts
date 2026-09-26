import type { ChatMessage } from '../transcript';
import { contentItems } from './content-items';
import { recordMetadata } from './record-metadata';
import { asBlocks, asRecord, type Block } from './records';
import { toolMessage } from './tool-message';

export function userMessages(record: Block, toolNames: Map<string, string>): ChatMessage[] {
  const content = asRecord(record.message).content;
  const metadata = recordMetadata(record);
  if (typeof content === 'string') {
    return [{ role: 'user', content, metadata }];
  }
  const messages: ChatMessage[] = [];
  let pending: Block[] = [];
  const flush = () => {
    if (pending.length > 0) {
      messages.push({ role: 'user', content: contentItems(pending), metadata });
      pending = [];
    }
  };
  for (const block of asBlocks(content)) {
    if (block.type === 'tool_result') {
      flush();
      messages.push(toolMessage(block, toolNames, metadata));
    } else {
      pending.push(block);
    }
  }
  flush();
  return messages;
}
