import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadFile } from './load-file';

describe('loadFile', () => {
  it('reads UTF-8 text and rejects directories and invalid bytes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'telelux-load-'));
    try {
      const path = join(dir, 'sample.jsonl');
      writeFileSync(path, 'café 👋');
      expect(loadFile(path, 'transcript', '.jsonl')).toBe('café 👋');
      expect(() => loadFile(dir, 'transcript', '.jsonl')).toThrow('is a directory');
      writeFileSync(path, Buffer.from([0xff]));
      expect(() => loadFile(path, 'transcript', '.jsonl')).toThrow();
    } finally { rmSync(dir, {recursive: true, force: true}); }
  });
  it('rejects files over 50 MiB', () => {
    const dir = mkdtempSync(join(tmpdir(), 'telelux-large-'));
    try {
      const path = join(dir, 'large.jsonl');
      writeFileSync(path, Buffer.alloc(50 * 1024 * 1024 + 1));
      expect(() => loadFile(path, 'transcript', '.jsonl')).toThrow('50 MiB');
    } finally { rmSync(dir, {recursive: true, force: true}); }
  });
});
