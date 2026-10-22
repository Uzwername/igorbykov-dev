import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

import { SITE_URL } from './src/constants/site';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // Matches how Cloudflare serves `/cv/index.html` (at `/cv/`), so canonical URLs,
  // the sitemap and internal links all agree and nothing needs a redirect.
  trailingSlash: 'always',
  // Hashes every inline script/style into a per-page CSP `<meta>`; the
  // remaining (non-script) directives live in `public/_headers`.
  security: { csp: true },
  // No Markdown content; Shiki's inline styles would also clash with the CSP.
  markdown: { syntaxHighlight: false },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.endsWith('/under-construction/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
