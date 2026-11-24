import { defineConfig } from 'astro/config';

export default defineConfig({
  // Set this to the real domain before deploying (used for canonical URLs).
  site: 'https://example.com',
  // hide Astro's floating dev toolbar during `npm run dev`
  devToolbar: { enabled: false },
});
