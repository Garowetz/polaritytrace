import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /polaritytrace/ until a custom domain is
// attached. When polaritytrace.com is pointed at it, set BASE_PATH=/ in the
// deploy workflow (and add public/CNAME).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  test: {
    include: ['src/**/*.test.ts'],
  },
});
