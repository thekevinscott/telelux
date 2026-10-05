import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadAnnotations } from './load-annotations';

describe('loadAnnotations', () => {
  it('loads valid JSON and rejects malformed JSON and invalid UTF-8', () => {
    const dir = mkdtempSync(join(tmpdir(), 'telelux-annotations-'));
    try {
      const path = join(dir, 'annotations.json');
      writeFileSync(path, '{"version":1}');
      expect(loadAnnotations(path)).toBe('{"version":1}');
      writeFileSync(path, '{');
      expect(() => loadAnnotations(path)).toThrow('not valid JSON');
      try { loadAnnotations(path); } catch (error) { expect((error as Error).cause).toBeInstanceOf(SyntaxError); }
      writeFileSync(path, Buffer.from([0xff]));
      expect(() => loadAnnotations(path)).toThrow('not UTF-8');
      try { loadAnnotations(path); } catch (error) { expect((error as Error).cause).toBeInstanceOf(TypeError); }
      expect(() => loadAnnotations(join(dir, 'missing.json'))).toThrow('ENOENT');
      expect(() => loadAnnotations(dir)).toThrow('pass one .json annotations file');
    } finally { rmSync(dir, {recursive: true, force: true}); }
  });
});
