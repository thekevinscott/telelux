import type { ChatMessage, Content } from '../transcript';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

function items(content: ChatMessage['content']): Content[] {
  return typeof content === 'string' ? (content === '' ? [] : [{ type: 'text', text: content }]) : content;
}

function mergedMetadata(previous: Assistant, next: Assistant): Pick<Assistant, 'metadata'> {
  const uuid = next.metadata?.uuid;
  if (typeof uuid !== 'string') {
    return {};
  }
  const merged = previous.metadata?.mergedUuids;
  return { metadata: { ...previous.metadata, mergedUuids: [...(Array.isArray(merged) ? merged : []), uuid] } };
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
