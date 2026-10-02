export function standaloneName(source: string): string {
  if (source === '') {
    return 'transcript.html';
  }
  const dot = source.lastIndexOf('.');
  return `${dot > 0 ? source.slice(0, dot) : source}.html`;
}
