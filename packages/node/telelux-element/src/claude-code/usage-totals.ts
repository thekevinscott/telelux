import type { ChatMessage } from '../transcript';
import { USAGE_KEYS } from './usage';

export function usageTotals(messages: ChatMessage[]): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(USAGE_KEYS.map((key) => [key, 0]));
  for (const message of messages) {
    const usage = message.metadata?.usage;
    if (typeof usage !== 'object' || usage === null || Array.isArray(usage)) {
      continue;
    }
    for (const key of USAGE_KEYS) {
      const value = usage[key];
      totals[key] += typeof value === 'number' ? value : 0;
    }
  }
  return totals;
}
