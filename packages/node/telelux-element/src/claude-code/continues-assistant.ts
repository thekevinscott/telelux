import type { ChatMessage } from '../transcript';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

export function continuesAssistant(pair: [ChatMessage | undefined, ChatMessage]): pair is [Assistant, Assistant] {
  const [previous, next] = pair;
  return (
    previous?.role === 'assistant' &&
    next.role === 'assistant' &&
    typeof previous.metadata?.messageId === 'string' &&
    previous.metadata.messageId === next.metadata?.messageId
  );
}
