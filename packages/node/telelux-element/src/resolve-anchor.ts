import type { Anchor } from './annotations';
import type { ChatMessage } from './transcript';

function byUuid(message: ChatMessage, uuid: string): boolean {
  const merged = message.metadata?.mergedUuids;
  return message.metadata?.uuid === uuid || (Array.isArray(merged) && merged.includes(uuid));
}

export function resolveAnchor(messages: ChatMessage[], anchor: Anchor): number | undefined {
  const candidates = [
    () => (anchor.uuid === undefined ? -1 : messages.findIndex((message) => byUuid(message, anchor.uuid as string))),
    () => (anchor.tool_call_id === undefined ? -1 : messages.findIndex((message) => message.role === 'assistant' && (message.tool_calls ?? []).some(({ id }) => id === anchor.tool_call_id))),
    () => (anchor.tool_call_id === undefined ? -1 : messages.findIndex((message) => (message.role === 'tool' || message.role === 'user') && message.tool_call_id === anchor.tool_call_id)),
    () => (anchor.index !== undefined && anchor.index < messages.length ? anchor.index : -1),
  ];
  for (const candidate of candidates) {
    const index = candidate();
    if (index !== -1) {
      return index;
    }
  }
  return undefined;
}
