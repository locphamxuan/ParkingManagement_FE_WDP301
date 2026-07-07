import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Cấu hình test riêng (không đụng vite.config.js dùng cho dev/build).
// jsdom cho render component; setup nạp matcher jest-dom cho Vitest.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false, // import { describe, it, expect } from 'vitest' tường minh (khỏi sửa tsconfig types)
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
