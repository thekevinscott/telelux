import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const bin = fileURLToPath(new URL('../../bin/telelux.mjs', import.meta.url));
const run = (...args: string[]) => spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' });

describe('telelux CLI', () => {
  it('exports HTML, prints a byte-compatible link, and refuses overwrite', () => {
    const dir = mkdtempSync(join(tmpdir(), 'telelux-cli-'));
    try {
      const transcript = join(dir, 'session.jsonl');
      const annotations = join(dir, 'review.json');
      const output = join(dir, 'session.html');
      writeFileSync(transcript, '{"text":"hello"}\n');
      writeFileSync(annotations, '{"version":1}');
      const exported = run(transcript, '--annotations', annotations, '--out', output);
      expect(exported.status).toBe(0);
      expect(exported.stdout).toBe(`${output}\n`);
      expect(readFileSync(output, 'utf8')).toContain('{"version":1}');
      const existing = run(transcript, '--out', output);
      expect(existing.status).toBe(1);
      expect(existing.stderr).toBe(`Error: ${output}: File exists\n`);
      const vector = JSON.parse(readFileSync(new URL('../../../../../fixtures/link/v1.json', import.meta.url), 'utf8')) as { text: string; data: string };
      writeFileSync(transcript, vector.text);
      const linked = run(transcript, '--url');
      expect(linked.status).toBe(0);
      expect(linked.stdout).toBe(`https://telelux.dev/#v=1&data=${vector.data}\n`);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('returns usage errors with exit 2', () => {
    for (const args of [['--out', 'out.html'], ['--url'], ['--annotations', 'notes.json'], ['--nope'], ['a', 'b'], ['--port', 'bad']]) {
      const result = run(...args);
      expect(result.status).toBe(2);
      expect(result.stderr).toContain('Usage: telelux [OPTIONS] [TRANSCRIPT]');
    }
    const dir = mkdtempSync(join(tmpdir(), 'telelux-cli-'));
    try {
      const transcript = join(dir, 'session.jsonl');
      writeFileSync(transcript, 'hello');
      expect(run(transcript, '--url', '--out', join(dir, 'out.html')).status).toBe(2);
      expect(run(transcript, '--url', '--annotations', join(dir, 'notes.json')).status).toBe(2);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it('reports file errors with exit 1', () => {
    const missing = run('missing-telelux-transcript.jsonl', '--no-browser');
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('No such file or directory');
  });
  it('serves the empty viewer without a transcript', async () => {
    const child = spawn(process.execPath, [bin, '--no-browser', '--port', '0'], { stdio: ['ignore', 'pipe', 'pipe'] });
    try {
      const port = await new Promise<number>((resolve, reject) => {
        let output = '';
        child.stderr.on('data', (chunk: Buffer) => {
          output += chunk.toString();
          const match = output.match(/Serving on http:\/\/127\.0\.0\.1:(\d+)\//);
          if (match) resolve(Number(match[1]));
        });
        child.on('exit', (code) => reject(new Error(`CLI exited ${code}: ${output}`)));
      });
      const page = await fetch(`http://127.0.0.1:${port}/`);
      expect(page.status).toBe(200);
      expect(await page.text()).toContain('<script type="application/x-ndjson" id="transcript"></script>');
    } finally { child.kill(); }
  });
});
