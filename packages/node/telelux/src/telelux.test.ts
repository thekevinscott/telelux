import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Telelux } from './telelux';

describe('Telelux', () => {
  it('snapshots files on assignment and protects prior state on failed assignment', () => {
    const dir = mkdtempSync(join(tmpdir(), 'telelux-sdk-'));
    try {
      const path = join(dir, 'transcript.jsonl');
      writeFileSync(path, 'first');
      const viewer = new Telelux(path);
      writeFileSync(path, 'second');
      expect(viewer.html).toContain('first');
      viewer.transcript = path;
      expect(viewer.html).toContain('second');
      expect(() => { viewer.transcript = dir; }).toThrow('is a directory');
      expect(viewer.transcript).toBe(path);
      expect(viewer.html).toContain('second');
      viewer.transcript = null;
      expect(() => viewer.html).toThrow('No transcript set');
    } finally { rmSync(dir, {recursive: true, force: true}); }
  });
  it('embeds annotations, blocks annotated links, and writes exclusively', () => {
    const dir = mkdtempSync(join(tmpdir(), 'telelux-sdk-'));
    try {
      const transcript = join(dir, 'transcript.jsonl');
      const annotations = join(dir, 'annotations.json');
      const output = join(dir, 'out.html');
      writeFileSync(transcript, 'hello');
      writeFileSync(annotations, '{"version":1}');
      const viewer = new Telelux(transcript, annotations);
      expect(viewer.annotations).toBe(annotations);
      expect(viewer.html).toContain('{"version":1}');
      expect(() => viewer.url).toThrow("can't carry annotations");
      viewer.write(output);
      expect(readFileSync(output, 'utf8')).toBe(viewer.html);
      expect(() => viewer.write(output)).toThrow();
      viewer.annotations = null;
      expect(viewer.url).toContain('#v=1&data=');
    } finally { rmSync(dir, {recursive: true, force: true}); }
  });
  it('refuses exports without a transcript', () => {
    const viewer = new Telelux();
    expect(() => viewer.url).toThrow('No transcript set');
    expect(() => viewer.write('/tmp/unused-telelux.html')).toThrow('No transcript set');
  });
});
