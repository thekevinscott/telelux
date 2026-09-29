import { currentBlock } from './current-block';

export type Extent = { top: number; bottom: number };

export function targetBlock(extents: Extent[], viewportHeight: number, current: number | undefined, step: number): number | undefined {
  const base = currentBlock(extents, viewportHeight, current);
  if (base === undefined) {
    return undefined;
  }
  return Math.min(Math.max(base + step, 0), extents.length - 1);
}
