import type { ChatMessage } from './transcript';

export const USAGE_TOTALS = [
  ['input_tokens', 'Input tokens'],
  ['output_tokens', 'Output tokens'],
  ['cache_read_input_tokens', 'Cache reads'],
  ['cache_creation_input_tokens', 'Cache writes'],
] as const;

type UsageKey = (typeof USAGE_TOTALS)[number][0];

export type TranscriptTotals = {
  usage: Partial<Record<UsageKey, number>>;
  toolCalls: number;
  roles: Partial<Record<ChatMessage['role'], number>>;
};

export function transcriptTotals(messages: ChatMessage[]): TranscriptTotals {
  const totals: TranscriptTotals = { usage: {}, toolCalls: 0, roles: {} };
  for (const message of messages) {
    totals.roles[message.role] = (totals.roles[message.role] ?? 0) + 1;
    if (message.role === 'assistant') {
      totals.toolCalls += message.tool_calls?.length ?? 0;
    }
    const usage = message.metadata?.usage;
    if (typeof usage !== 'object' || Array.isArray(usage)) {
      continue;
    }
    for (const [key] of USAGE_TOTALS) {
      const value = usage[key];
      if (typeof value === 'number') {
        totals.usage[key] = (totals.usage[key] ?? 0) + value;
      }
    }
  }
  return totals;
}
