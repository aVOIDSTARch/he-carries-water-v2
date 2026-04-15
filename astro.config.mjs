// @ts-check
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.hecarrieswater.com',

  vite: {
    server: {
      port: 4343,
    },
    resolve: {
      alias: {
        '@utils': '/src/utils',
        '@components': '/src/components',
        '@styles': '/src/styles',
        '@images': '/src/images',
        '@pages': '/src/pages',
      },
    },
 },

  server: {
    port: 4343,
  },

  integrations: [preact()],
});
