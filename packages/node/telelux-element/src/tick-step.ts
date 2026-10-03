export function tickStep(count: number, zoom: number): number {
  const target = count / (8 * zoom);
  let magnitude = 1;
  while (5 * magnitude < target) {
    magnitude *= 10;
  }
  return [1, 2, 5].map((multiple) => multiple * magnitude).find((step) => step >= target) as number;
}
