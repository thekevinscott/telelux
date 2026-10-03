import type { ChatMessage } from '../transcript';

type Assistant = Extract<ChatMessage, { role: 'assistant' }>;

export function mergedMetadata(previous: Assistant, next: Assistant): Pick<Assistant, 'metadata'> {
  const uuid = next.metadata?.uuid;
  if (typeof uuid !== 'string') {
    return {};
  }
  const merged = previous.metadata?.mergedUuids;
  return { metadata: { ...previous.metadata, mergedUuids: [...(Array.isArray(merged) ? merged : []), uuid] } };
}
