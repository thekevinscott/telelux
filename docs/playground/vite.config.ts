import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: fileURLToPath(new URL('../public/playground', import.meta.url)),
    emptyOutDir: true,
    lib: {
      entry: fileURLToPath(new URL('./element.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'telelux-element.js',
    },
  },
});
