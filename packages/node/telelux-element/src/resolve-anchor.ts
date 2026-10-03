import type { Anchor } from './annotations';
import type { ChatMessage } from './transcript';

export function resolveAnchor(messages: ChatMessage[], { uuid, tool_call_id: call, index }: Anchor): number | undefined {
  const found = [
    messages.findIndex(({ metadata }) => uuid !== undefined && (metadata?.uuid === uuid || (Array.isArray(metadata?.mergedUuids) && metadata.mergedUuids.includes(uuid)))),
    messages.findIndex((message) => message.role === 'assistant' && message.tool_calls?.some(({ id }) => id === call)),
    messages.findIndex((message) => call !== undefined && (message.role === 'tool' || message.role === 'user') && message.tool_call_id === call),
  ].find((position) => position !== -1);
  return found ?? ((index ?? Infinity) < messages.length ? index : undefined);
}
