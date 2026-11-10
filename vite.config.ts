import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /polaritytrace/ until a custom domain is
// attached. When polaritytrace.com is pointed at it, set BASE_PATH=/ in the
// deploy workflow (and add public/CNAME).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // Two pages: the site, and the parts list for review (linked from the footer).
  build: {
    rollupOptions: {
      input: { main: 'index.html', parts: 'parts.html' },
    },
  },
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })),
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
