import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // The live domain, used for canonical URLs, Open Graph URLs and the sitemap.
  site: 'https://www.ergonlabs.studio',
  integrations: [
    // the archived design variations stay reachable but are kept out of the sitemap (they are noindex too)
    sitemap({
      filter: (page) => !page.includes('/archive') && !page.includes('/404'),
      // match the canonical URLs, which have no trailing slash
      serialize: (item) => ({ ...item, url: item.url.replace(/(.)\/$/, '$1') }),
    }),
  ],
  // hide Astro's floating dev toolbar during `npm run dev`
  devToolbar: { enabled: false },
});
