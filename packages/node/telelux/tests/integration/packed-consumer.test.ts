import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = fileURLToPath(new URL('../..', import.meta.url));

describe('packed telelux consumer', () => {
  it('ships the built viewer and reads it through the export', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'telelux-consumer-'));
    try {
      execFileSync('pnpm', ['pack', '--pack-destination', scratch], { cwd: packageRoot });
      const tarball = readdirSync(scratch).find((name) => name.endsWith('.tgz'));
      expect(tarball).toBeDefined();
      writeFileSync(join(scratch, 'package.json'), JSON.stringify({ private: true, type: 'module', dependencies: { telelux: `file:${join(scratch, tarball ?? '')}` } }));
      execFileSync('pnpm', ['install', '--no-frozen-lockfile', '--ignore-workspace'], { cwd: scratch });
      const script = `import { Telelux } from 'telelux'; import { readFileSync } from 'node:fs'; import { createRequire } from 'node:module'; const require = createRequire(import.meta.url); const page = readFileSync(require.resolve('telelux/viewer.html'), 'utf8'); if (!page.startsWith('<!doctype html>') || typeof Telelux !== 'function') process.exit(1);`;
      execFileSync('node', ['--input-type=module', '-e', script], { cwd: scratch });
      expect(execFileSync(join(scratch, 'node_modules/.bin/telelux'), ['--help'], { cwd: scratch, encoding: 'utf8' })).toContain('Usage: telelux');
      expect(readFileSync(join(scratch, 'node_modules/telelux/dist/viewer.html'))).toEqual(readFileSync(join(packageRoot, '../telelux-web/dist/viewer.html')));
    } finally { rmSync(scratch, { recursive: true, force: true }); }
  }, 300_000);
});
