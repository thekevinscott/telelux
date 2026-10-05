import { fileURLToPath } from 'node:url';
import { copyFileSync } from 'node:fs';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    {
      name: 'copy-viewer',
      closeBundle() {
        copyFileSync(fileURLToPath(new URL('../telelux-web/dist/viewer.html', import.meta.url)), fileURLToPath(new URL('./dist/viewer.html', import.meta.url)));
      },
    },
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/vitest.config.ts'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: 'dist',
    rollupOptions: { external: [/^node:/] },
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
    },
  },
});
