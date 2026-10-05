export function fillSlot(page: string, openTag: string, text: string, name: string): string {
  const slot = `${openTag}</script>`;
  const count = page.split(slot).length - 1;
  if (count !== 1) {
    throw new Error(`The packaged viewer has ${count} ${name} slots instead of one; reinstall telelux`);
  }
  return page.replace(slot, `${openTag}${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</script>`);
}
