import { encodePayload } from './encode-payload';

export function buildLink(text: string): string {
  const PREFIX = 'https://telelux.dev/#v=1&data=';
  const ALTERNATIVES = `Export the transcript as baked HTML instead, or host the .jsonl file and share ${PREFIX}<transcript-url>.`;
  const size = Buffer.byteLength(text, 'utf8');
  const limit = 10 * 1024 * 1024;
  if (size > limit) {
    throw new Error(`The transcript is ${size} bytes, over the ${limit}-byte (10 MiB) limit for a link. ${ALTERNATIVES}`);
  }
  const link = PREFIX + encodePayload(text);
  if (link.length > 8000) {
    throw new Error(`The link would be ${link.length} characters, over the 8000-character limit. ${ALTERNATIVES}`);
  }
  return link;
}
