import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://elements.seanmahoney.ai',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  server: {
    host: '127.0.0.1',
    port: 8011,
  },
  vite: {
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
  },
});
