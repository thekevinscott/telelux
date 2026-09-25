import type { ChatMessage, Content } from '../transcript';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

const items = (content: ChatMessage['content']): Content[] =>
  typeof content === 'string' ? (content === '' ? [] : [{ type: 'text', text: content }]) : content;

export function mergeAssistant(previous: Assistant, next: Assistant): Assistant {
  const toolCalls = [...(previous.tool_calls ?? []), ...(next.tool_calls ?? [])];
  return {
    ...previous,
    content: [...items(previous.content), ...items(next.content)],
    ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
  };
}
