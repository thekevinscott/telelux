export function timelineLanes(spans: { start: number; end: number }[]): number[] {
  const lanes: number[] = [];
  const ends: number[] = [];
  const order = [...spans.keys()].sort((a, b) => spans[a].start - spans[b].start);
  for (const position of order) {
    const { start, end } = spans[position];
    const free = ends.findIndex((last) => last < start);
    const lane = free === -1 ? ends.length : free;
    ends[lane] = end;
    lanes[position] = lane;
  }
  return lanes;
}
