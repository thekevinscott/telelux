export function bakeTranscript(html: string, text: string): string {
  const page = new DOMParser().parseFromString(html, 'text/html');
  const slot = page.getElementById('transcript');
  if (!slot) {
    throw new Error('The page has no transcript slot to bake into.');
  }
  page.getElementById('root')?.replaceChildren();
  slot.textContent = text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<!doctype html>\n${page.documentElement.outerHTML}`;
}
