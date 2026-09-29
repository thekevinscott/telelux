export function stripScroll(start: number, size: number, scroll: number, viewport: number): number {
  if (start < scroll) {
    return start;
  }
  if (start + size > scroll + viewport) {
    return start + size - viewport;
  }
  return scroll;
}
