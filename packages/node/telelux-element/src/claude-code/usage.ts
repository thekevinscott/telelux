import type { Block } from './records';

export const USAGE_KEYS = [
  'input_tokens',
  'cache_creation_input_tokens',
  'cache_read_input_tokens',
  'output_tokens',
] as const;

export function usage(message: Block): Record<string, number> | undefined {
  const source = message.usage;
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }
  const entries = USAGE_KEYS.flatMap((key) => {
    const value = (source as Record<string, unknown>)[key];
    return typeof value === 'number' ? [[key, value] as const] : [];
  });
  return entries.length === 0 ? undefined : Object.fromEntries(entries);
}
