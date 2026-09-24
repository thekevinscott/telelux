import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

export default defineConfig({
  root: fileURLToPath(new URL('./demo', import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL('./dist-demo', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      // The package's `sideEffects` field scopes side effects to
      // dist/index.js for publishing; that marks everything under src/ and
      // demo/ as effect-free, so Rollup drops the whole demo bundle.
      treeshake: false,
    },
  },
});
