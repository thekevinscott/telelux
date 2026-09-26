import { messageText } from '../message-text';
import type { ChatMessage, Metadata } from '../transcript';
import { contentItems } from './content-items';
import { asBlocks, type Block, str } from './records';

export function toolMessage(block: Block, toolNames: Map<string, string>, metadata: Metadata): ChatMessage {
  const id = str(block.tool_use_id);
  const content = typeof block.content === 'string' ? block.content : contentItems(asBlocks(block.content));
  const name = toolNames.get(id);
  return {
    role: 'tool',
    content,
    tool_call_id: id,
    ...(name === undefined ? {} : { function: name }),
    ...(block.is_error === true ? { error: { type: 'tool_result', message: messageText(content) } } : {}),
    metadata,
  };
}
