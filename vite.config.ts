import { sentryVitePlugin } from '@sentry/vite-plugin';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

import VueRouter from 'unplugin-vue-router/vite';

import { defineConfig } from 'vite';
import Layouts from 'vite-plugin-vue-layouts-next';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [VueRouter(), vue(), Layouts(), tailwindcss(), sentryVitePlugin({
    org: 'aron-schuler-it-services',
    project: 'chickenburger-scout',
  })],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    sourcemap: true,
  },
});
