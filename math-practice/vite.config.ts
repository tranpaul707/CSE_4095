import { defineConfig } from 'vitest/config';
export default defineConfig({
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
  },
});
