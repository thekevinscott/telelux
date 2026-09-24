import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Every path here is absolute or cwd-agnostic on purpose: the mutation gate runs
// vitest from the package root while the coverage gate runs it from src/, and
// vitest only reads the config sitting in its own cwd. src/vitest.config.ts
// re-exports this one so both roots see the same settings.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [fileURLToPath(new URL('./vitest.setup.ts', import.meta.url))],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    coverage: {
      provider: 'v8',
      include: ['**/*.ts', '**/*.tsx'],
      exclude: ['**/*.test.ts', '**/*.test.tsx', '**/main.tsx', '**/vitest.config.ts'],
    },
  },
});
