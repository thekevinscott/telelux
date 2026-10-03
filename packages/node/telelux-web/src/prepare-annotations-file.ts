import type { AnnotationSidecar } from 'telelux-element/parse';

import { readSidecar } from './read-sidecar';

export type AnnotationsFileResult =
  | { kind: 'none' }
  | { kind: 'annotations'; annotations: AnnotationSidecar }
  | { kind: 'error'; message: string };

export async function prepareAnnotationsFile(files: ArrayLike<File>): Promise<AnnotationsFileResult> {
  const MIB = 1024 * 1024;
  if (files.length === 0) {
    return { kind: 'none' };
  }
  if (files.length > 1) {
    return { kind: 'error', message: `Open one annotations file at a time; ${files.length} were given.` };
  }
  const file = files[0];
  if (file.size > 50 * MIB) {
    return { kind: 'error', message: `${file.name} is ${(file.size / MIB).toFixed(1)} MiB; the limit is 50 MiB.` };
  }
  let bytes: ArrayBuffer;
  try {
    bytes = await file.arrayBuffer();
  } catch {
    return { kind: 'error', message: `Could not read ${file.name}. Open a single annotations file, not a folder.` };
  }
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return { kind: 'error', message: `${file.name} is not valid UTF-8 text.` };
  }
  const read = readSidecar(text, file.name);
  return read.ok ? { kind: 'annotations', annotations: read.annotations } : { kind: 'error', message: read.error };
}
