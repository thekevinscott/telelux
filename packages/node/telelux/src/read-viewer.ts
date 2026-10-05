import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function readViewer(): string {
  return readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'viewer.html'), 'utf8');
}
