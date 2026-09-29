export type Extent = { top: number; bottom: number };

export function targetBlock(extents: Extent[], viewportHeight: number, current: number | undefined, step: number): number | undefined {
  if (extents.length === 0) {
    return undefined;
  }
  const last = extents.length - 1;
  const tracked = current === undefined ? undefined : extents[current];
  const topmost = extents.findIndex((extent) => extent.bottom > 0);
  let base = topmost === -1 ? last : topmost;
  if (tracked !== undefined && tracked.bottom > 0 && tracked.top < viewportHeight) {
    base = current as number;
  }
  return Math.min(Math.max(base + step, 0), last);
}
