import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import { SITE_URL } from './src/constants/site';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // Matches how GitHub Pages serves `/cv/index.html`, so canonical URLs,
  // the sitemap and internal links all agree and nothing needs a redirect.
  trailingSlash: 'always',
  integrations: [react(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },
});
