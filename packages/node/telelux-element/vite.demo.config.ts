import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { defineConfig, type Plugin } from 'vite';

const demo = (name: string) => fileURLToPath(new URL(`./demo/${name}`, import.meta.url));

const fixture = (name: string) => readFileSync(fileURLToPath(new URL(`../../../fixtures/${name}`, import.meta.url)), 'utf8');

const inlineFixtures: Plugin = {
  name: 'inline-fixtures',
  transformIndexHtml: (page) =>
    page.replace(
      /<script type="text\/plain" data-fixture="([^"]+)"><\/script>/g,
      (_match, name: string) => `<script type="text/plain">${fixture(name)}</script>`,
    ),
};

export default defineConfig({
  root: fileURLToPath(new URL('./demo', import.meta.url)),
  plugins: [inlineFixtures],
  build: {
    outDir: fileURLToPath(new URL('./dist-demo', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: { index: demo('index.html'), slot: demo('slot.html') },
      // The package's `sideEffects` field scopes side effects to
      // dist/index.js for publishing; that marks everything under src/ and
      // demo/ as effect-free, so Rollup drops the whole demo bundle.
      treeshake: false,
    },
  },
});
