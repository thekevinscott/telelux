import { parseRawTranscript } from 'telelux-element/parse';

import { encodeBase64url } from './encode-base64url';
import { gzip } from './gzip';

export type LocalFileResult =
  | { kind: 'none' }
  | { kind: 'link'; hash: string }
  | { kind: 'too-large'; name: string; text: string; message: string }
  | { kind: 'error'; message: string };

export async function prepareLocalFile(files: ArrayLike<File>, base: string): Promise<LocalFileResult> {
  const MIB = 1024 * 1024;
  const mib = (size: number) => (size / MIB).toFixed(1);
  if (files.length === 0) {
    return { kind: 'none' };
  }
  if (files.length > 1) {
    return { kind: 'error', message: `Open one transcript file at a time; ${files.length} were given.` };
  }
  const file = files[0];
  if (file.size > 50 * MIB) {
    return { kind: 'error', message: `${file.name} is ${mib(file.size)} MiB; the limit is 50 MiB.` };
  }
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return { kind: 'error', message: `Could not read ${file.name}. Open a single transcript file, not a folder.` };
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { kind: 'error', message: `${file.name} is not valid UTF-8 text.` };
  }
  const parsed = parseRawTranscript(text);
  if (!parsed.ok) {
    return { kind: 'error', message: `Cannot open ${file.name}. ${parsed.error}` };
  }
  const tooLarge = (reason: string): LocalFileResult => ({
    kind: 'too-large',
    name: file.name,
    text,
    message: `${file.name} is too large for a shareable link: ${reason}.`,
  });
  if (bytes.length > 10 * MIB) {
    return tooLarge(`it is ${mib(bytes.length)} MiB, and links hold at most 10 MiB`);
  }
  const hash = `#v=1&data=${encodeBase64url(await gzip(bytes))}`;
  const length = base.length + hash.length;
  return length > 8000 ? tooLarge(`it needs ${length} characters, and links are capped at 8,000`) : { kind: 'link', hash };
}
