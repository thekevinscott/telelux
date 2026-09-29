export function blockNumber(value: string, count: number): number | undefined {
  if (count === 0 || !/^\s*\d+\s*$/.test(value)) {
    return undefined;
  }
  return Math.min(Number(value), count - 1);
}
