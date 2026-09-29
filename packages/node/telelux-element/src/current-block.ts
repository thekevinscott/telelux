import type { Extent } from './target-block';

export function currentBlock(extents: Extent[], viewportHeight: number, tracked: number | undefined): number | undefined {
  if (extents.length === 0) {
    return undefined;
  }
  const extent = tracked === undefined ? undefined : extents[tracked];
  if (extent !== undefined && extent.bottom > 0 && extent.top < viewportHeight) {
    return tracked;
  }
  const topmost = extents.findIndex((candidate) => candidate.bottom > 0);
  return topmost === -1 ? extents.length - 1 : topmost;
}
