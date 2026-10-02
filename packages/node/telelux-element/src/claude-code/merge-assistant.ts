import type { ChatMessage, Content } from '../transcript';
import { mergedMetadata } from './merged-metadata';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

function items(content: ChatMessage['content']): Content[] {
  return typeof content === 'string' ? (content === '' ? [] : [{ type: 'text', text: content }]) : content;
}

export function mergeAssistant(previous: Assistant, next: Assistant): Assistant {
  const toolCalls = [...(previous.tool_calls ?? []), ...(next.tool_calls ?? [])];
  return {
    ...previous,
    ...mergedMetadata(previous, next),
    content: [...items(previous.content), ...items(next.content)],
    ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
  };
}
