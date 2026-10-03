export function readBakedSlot(page: Document, id: string): string | undefined {
  const escaped = page.getElementById(id)?.textContent ?? '';
  if (escaped === '') {
    return undefined;
  }
  const entities: Record<string, string> = { '&lt;': '<', '&gt;': '>', '&amp;': '&' };
  return escaped.replace(/&(?:lt|gt|amp);/g, (entity) => entities[entity]);
}
