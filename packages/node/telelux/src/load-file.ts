import { openSync, readSync, closeSync, fstatSync, statSync } from 'node:fs';

const MAX_BYTES = 50 * 1024 * 1024;

export function loadFile(path: string, kind: string, extension: string): string {
  if (statSync(path).isDirectory()) {
    throw new Error(`${path} is a directory; pass one ${extension} ${kind} file inside it`);
  }
  const file = openSync(path, 'r');
  try {
    const buffer = Buffer.allocUnsafe(MAX_BYTES + 1);
    const size = readSync(file, buffer, 0, buffer.length, null);
    if (size > MAX_BYTES) {
      throw new Error(`${path} is ${fstatSync(file).size} bytes, over the ${MAX_BYTES}-byte (50 MiB) ${kind} limit`);
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer.subarray(0, size));
  } finally {
    closeSync(file);
  }
}
