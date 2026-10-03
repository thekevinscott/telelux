import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const packageRoot = fileURLToPath(new URL('../..', import.meta.url));
const fixture = fileURLToPath(new URL('../../../../../fixtures/claude-code/sample.transcript.json', import.meta.url));
const origin = 'http://consumer.test';

const pnpm = (cwd: string, ...args: string[]) => {
  execFileSync('pnpm', args, { cwd, stdio: 'pipe' });
};

const consumerPage = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <script type="module" src="./main.js"></script>
  </head>
  <body>
    <telelux-transcript></telelux-transcript>
  </body>
</html>
`;

const consumerScript = `import 'telelux-element';
import transcript from './sample.transcript.json';

document.querySelector('telelux-transcript').transcript = transcript;
`;

test.describe('the packed telelux-element tarball installed into a bare Vite page', () => {
  let scratch: string;
  let site: string;

  test.beforeAll(async () => {
    test.setTimeout(300_000);
    scratch = mkdtempSync(join(tmpdir(), 'telelux-element-consumer-'));
    const consumer = join(scratch, 'consumer');
    site = join(consumer, 'dist');

    pnpm(packageRoot, 'build');
    pnpm(packageRoot, 'pack', '--pack-destination', scratch);
    const tarball = readdirSync(scratch).find((name) => name.endsWith('.tgz'));
    const vite = JSON.parse(readFileSync(join(packageRoot, 'node_modules/vite/package.json'), 'utf8')).version;

    mkdirSync(consumer);
    writeFileSync(
      join(consumer, 'package.json'),
      JSON.stringify({
        name: 'consumer',
        private: true,
        type: 'module',
        dependencies: { 'telelux-element': `file:${join(scratch, tarball ?? '')}` },
        devDependencies: { vite },
      }),
    );
    writeFileSync(join(consumer, 'index.html'), consumerPage);
    writeFileSync(join(consumer, 'main.js'), consumerScript);
    copyFileSync(fixture, join(consumer, 'sample.transcript.json'));

    pnpm(consumer, 'install', '--no-frozen-lockfile', '--prefer-offline', '--ignore-workspace');
    pnpm(consumer, 'exec', 'vite', 'build');
  });

  test.afterAll(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  test('renders the fixture transcript from one element and one property assignment', async ({ page }) => {
    await page.route(`${origin}/**`, (route) => {
      const path = new URL(route.request().url()).pathname;
      return route.fulfill({ path: join(site, path === '/' ? 'index.html' : path) });
    });

    await page.goto(`${origin}/`);

    const element = page.locator('telelux-transcript');
    await expect(element.locator('telelux-message')).toHaveCount(30);
    await expect(element.locator('telelux-message').first()).toContainText('Port reference_implementation/ to typescript');
  });
});
