import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const deployedURL = process.env.PLAYWRIGHT_BASE_URL;
const proxyURL = deployedURL && (process.env.HTTPS_PROXY || process.env.HTTP_PROXY);
const proxy = proxyURL ? new URL(proxyURL) : null;

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  use: {
    baseURL: deployedURL || 'http://127.0.0.1:4174',
    headless: true,
    ...(proxy
      ? {
          proxy: {
            server: proxy.origin,
            ...(proxy.username
              ? {
                  username: decodeURIComponent(proxy.username),
                  password: decodeURIComponent(proxy.password),
                }
              : {}),
          },
        }
      : {}),
    launchOptions: {
      // Prefer the cloud image's installed browser; other machines use Playwright's.
      ...(existsSync('/usr/bin/chromium') ? { executablePath: '/usr/bin/chromium' } : {}),
    },
  },
  webServer: deployedURL
    ? undefined
    : {
        command: 'npm run build && npm run preview',
        port: 4174,
        stdout: 'pipe',
        env: { PORT: '4174' },
        reuseExistingServer: false,
      },
});
