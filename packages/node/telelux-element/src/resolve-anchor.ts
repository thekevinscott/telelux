import type { Anchor } from './annotations';
import type { ChatMessage } from './transcript';

export function resolveAnchor(messages: ChatMessage[], anchor: Anchor): number | undefined {
  const { uuid, tool_call_id: call, index } = anchor;
  const candidates = [
    () => messages.findIndex(({ metadata }) => uuid !== undefined && (metadata?.uuid === uuid || (Array.isArray(metadata?.mergedUuids) && metadata.mergedUuids.includes(uuid)))),
    () => messages.findIndex((message) => call !== undefined && message.role === 'assistant' && (message.tool_calls ?? []).some(({ id }) => id === call)),
    () => messages.findIndex((message) => call !== undefined && message.role !== 'assistant' && message.role !== 'system' && message.tool_call_id === call),
    () => (index !== undefined && index < messages.length ? index : -1),
  ];
  for (const candidate of candidates) {
    const found = candidate();
    if (found !== -1) {
      return found;
    }
  }
  return undefined;
}
