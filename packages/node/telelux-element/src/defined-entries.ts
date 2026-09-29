import type { Metadata } from './transcript';

type Value = NonNullable<Metadata[string]>;

export function definedEntries(metadata: Metadata | undefined): [string, Value][] {
  return Object.entries(metadata ?? {}).filter((entry): entry is [string, Value] => entry[1] !== undefined);
}
