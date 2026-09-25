import type { ChatMessage } from '../transcript';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

export function continuesAssistant(previous: ChatMessage | undefined, next: ChatMessage): previous is Assistant {
  return (
    previous?.role === 'assistant' &&
    next.role === 'assistant' &&
    typeof previous.metadata?.messageId === 'string' &&
    previous.metadata.messageId === next.metadata?.messageId
  );
}
