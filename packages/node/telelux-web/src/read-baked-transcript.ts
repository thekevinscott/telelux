export function readBakedTranscript(page: Document): string | undefined {
  const escaped = page.getElementById('transcript')?.textContent ?? '';
  if (escaped === '') {
    return undefined;
  }
  const entities: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&' };
  return escaped.replace(/&(?:lt|gt|amp);/g, (entity) => entities[entity]);
}
