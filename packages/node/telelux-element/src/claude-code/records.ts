export type Block = Record<string, unknown>;

export const isRecord = (value: unknown): value is Block =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const asRecord = (value: unknown): Block => (isRecord(value) ? value : {});

export const asBlocks = (value: unknown): Block[] => (Array.isArray(value) ? value.filter(isRecord) : []);

export const str = (value: unknown): string => (typeof value === 'string' ? value : '');
