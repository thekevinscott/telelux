import type { ChatMessage } from './transcript';

export function messageText(content: ChatMessage['content']): string {
  if (typeof content === 'string') {
    return content;
  }
  return content
    .filter((item) => item.type === 'text')
    .map((item) => item.text ?? '')
    .join('\n');
}
