export type Block = Record<string, unknown>;

export function isRecord(value: unknown): value is Block {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asRecord(value: unknown): Block {
  return isRecord(value) ? value : {};
}

export function asBlocks(value: unknown): Block[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}
