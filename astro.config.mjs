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
 },

  server: {
    port: 4343,
  },

  integrations: [preact()],
});