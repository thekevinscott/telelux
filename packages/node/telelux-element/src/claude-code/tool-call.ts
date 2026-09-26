import type { ToolCall } from '../transcript';
import { asRecord, type Block, str } from './records';

export function toolCall(block: Block): ToolCall {
  return { id: str(block.id), function: str(block.name), type: 'function', arguments: asRecord(block.input) };
}
