import type { ChatMessage, Metadata } from '../transcript';
import { recordMetadata } from './record-metadata';
import type { Block } from './records';

export function resultMessage(record: Block): ChatMessage {
  const metadata: Metadata = recordMetadata(record);
  const parts: string[] = [];
  if (typeof record.subtype === 'string') {
    metadata.subtype = record.subtype;
    parts.push(record.subtype);
  }
  if (typeof record.total_cost_usd === 'number') {
    metadata.total_cost_usd = record.total_cost_usd;
    parts.push(`$${record.total_cost_usd.toFixed(4)}`);
  }
  if (typeof record.duration_ms === 'number') {
    metadata.duration_ms = record.duration_ms;
    parts.push(`${(record.duration_ms / 1000).toFixed(1)}s`);
  }
  if (typeof record.num_turns === 'number') {
    metadata.num_turns = record.num_turns;
    parts.push(`${record.num_turns} turns`);
  }
  if (record.is_error === true) {
    metadata.is_error = true;
    parts.push('error');
  }
  return { role: 'system', content: parts.length === 0 ? 'result' : parts.join(' · '), metadata };
}
