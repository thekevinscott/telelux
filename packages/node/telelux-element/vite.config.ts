import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/vitest.config.ts'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        parse: fileURLToPath(new URL('./src/parse.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^lit(\/|$)/, /^@lit\//],
    },
  },
});
