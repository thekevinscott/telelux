import { defineConfig } from 'vitest/config';

// Every path here is absolute or cwd-agnostic on purpose: the mutation gate runs
// vitest from the package root while the coverage gate runs it from src/, and
// vitest only reads the config sitting in its own cwd. src/vitest.config.ts
// re-exports this one so both roots see the same settings.
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    coverage: {
      provider: 'v8',
      include: ['**/*.ts'],
      exclude: ['**/*.test.ts', '**/index.ts', '**/vitest.config.ts'],
    },
  },
});
