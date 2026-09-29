import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  snapshotPathTemplate: '../../../fixtures/{arg}{ext}',
  use: { baseURL: 'http://localhost:4174' },
  webServer: {
    command: 'pnpm run preview --port 4174 --strictPort',
    url: 'http://localhost:4174',
    reuseExistingServer: !process.env.CI,
  },
});
