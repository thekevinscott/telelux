import type { Metadata } from '../transcript';
import type { Block } from './records';

const passthrough = ['uuid', 'timestamp', 'isMeta', 'isSidechain'] as const;

export function recordMetadata(record: Block): Metadata {
  const metadata: Metadata = { type: String(record.type) };
  for (const key of passthrough) {
    const value = record[key];
    if (typeof value === 'string' || value === true) {
      metadata[key] = value;
    }
  }
  return metadata;
}
