import type { Metadata } from '../transcript';
import type { Block } from './records';

export type Header = { id: string; name?: string; created_at?: string; metadata: Metadata };

const headerKeys = ['sessionId', 'cwd', 'version', 'gitBranch'] as const;

export function transcriptHeader(records: Block[]): Header {
  const first = (key: string) => records.map((record) => record[key]).find((value) => typeof value === 'string');
  const metadata: Metadata = { format: 'claude-code' };
  for (const key of headerKeys) {
    const value = first(key);
    if (value !== undefined) {
      metadata[key] = value;
    }
  }
  const name = first('customTitle') ?? first('aiTitle');
  const createdAt = first('timestamp');
  return {
    id: first('sessionId') ?? 'claude-code',
    ...(name === undefined ? {} : { name }),
    ...(createdAt === undefined ? {} : { created_at: createdAt }),
    metadata,
  };
}
