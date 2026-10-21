import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4174',
    headless: true,
    launchOptions: {
      // Prefer the cloud image's installed browser; other machines use Playwright's.
      ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}),
    },
  },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4174,
    env: { PORT: '4174' },
    reuseExistingServer: false,
  },
});
