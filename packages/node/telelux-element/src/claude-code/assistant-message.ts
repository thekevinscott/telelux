import type { ChatMessage, Metadata } from '../transcript';
import { contentItems } from './content-items';
import { recordMetadata } from './record-metadata';
import { asBlocks, asRecord, type Block } from './records';
import { toolCall } from './tool-call';
import { usage } from './usage';

export function assistantMessage(record: Block, toolNames: Map<string, string>): ChatMessage {
  const message = asRecord(record.message);
  const blocks = asBlocks(message.content);
  const toolCalls = blocks.filter((block) => block.type === 'tool_use').map(toolCall);
  for (const call of toolCalls) {
    toolNames.set(call.id, call.function);
  }
  const metadata: Metadata = recordMetadata(record);
  if (typeof message.id === 'string') {
    metadata.messageId = message.id;
  }
  if (typeof message.model === 'string') {
    metadata.model = message.model;
  }
  const tokens = usage(message);
  if (tokens !== undefined) {
    metadata.usage = tokens;
  }
  return {
    role: 'assistant',
    content: typeof message.content === 'string' ? message.content : contentItems(blocks.filter((block) => block.type !== 'tool_use')),
    ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
    metadata,
  };
}
