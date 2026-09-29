import type { ChatMessage } from './transcript';

export function reasoningText(content: ChatMessage['content']): string | undefined {
  if (typeof content === 'string') {
    return undefined;
  }
  return content.find((item) => item.type === 'reasoning' && item.reasoning !== undefined)?.reasoning;
}
