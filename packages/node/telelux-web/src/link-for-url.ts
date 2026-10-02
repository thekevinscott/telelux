export type UrlEntryResult = { kind: 'link'; hash: string } | { kind: 'invalid'; message: string };

export function linkForUrl(input: string): UrlEntryResult {
  const text = input.trim();
  if (text === '') {
    return { kind: 'invalid', message: 'Enter a transcript URL.' };
  }
  const url = URL.parse(text);
  if (url === null || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    return { kind: 'invalid', message: 'Enter a URL that starts with http:// or https://.' };
  }
  return { kind: 'link', hash: `#v=1&data=${url.href}` };
}
