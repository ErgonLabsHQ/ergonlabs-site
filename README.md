# Ergon Labs site

Website for Ergon Labs, an AI engineering firm. Built with Astro: static output, no framework runtime, a small
amount of JavaScript for the animations.

## Run it

```
npm install
npm run dev        # http://localhost:4321
npm run build      # writes ./dist
npm run preview    # serves ./dist
```

## Before going live

1. In `src/site.ts`, set `email` and the `socials` links (LinkedIn and X). They are placeholders.
2. Optionally set `bookingUrl` in `src/site.ts` to a Cal.com or Calendly link; the "Start a project" buttons then
   open the calendar instead of the contact form.
3. Set `site` in `astro.config.mjs` to the real domain (used for canonical URLs).
4. Read the copy in `src/nuvareth.ts` and keep only what is true for the team.

The contact form opens the visitor's mail app with the message filled in. To receive submissions directly, point
the form in `src/components/nv/Shell.astro` (and its handler in `src/components/nv/Behaviour.astro`) at a form
service or your own endpoint.

## Pages

- `/` (`src/pages/index.astro`): hero, services, "Our view" statement, AI in production demo, process timeline,
  engagements, values, FAQ and the contact form.
- `/founders` (`src/pages/founders.astro`): the founders and their profiles.

Both pages end with the same footer: a centred contact section, a large wordmark with the owl, and the copyright.

## Where things are

- **Content:** `src/nuvareth.ts` (headline, services, process, FAQ, founders, values). Contact details and social
  links come from `src/site.ts`.
- **Layout and theme:** `src/layouts/Site.astro` (fonts, favicon, background), `src/styles/nv.css` (shared
  structure) and `src/styles/site.css` (the dark night theme: colour tokens, cards, buttons, founders page).
  The accent colours are `--accent` (amber) and `--accent-2` (light amber).
- **Brand:**
  - `src/components/site/Owl.astro`: the owl drawing used in the logo and footer.
  - `src/components/site/Logo.astro`: the logo. The default lockup has the owl perched on the N of ERGON; the
    `inline` version (owl beside the wordmark) is used in the navigation bar.
  - `public/ergon-favicon.svg`: the favicon.
- **Background:**
  - `src/components/site/Backdrop.astro`: dot grid, glows, stars, fireflies and shooting stars, plus the cursor
    spotlight on cards and the tilt on founder photos.
  - `src/components/site/NightOwl.astro`: the large owl in front of the moon. Its eyes follow the cursor and blink;
    it fades to a softer level once the hero is scrolled past.
- **Sections:** `src/components/nv/` (page shell, navigation bar, shared page script) and `src/components/site/`
  (hero, "Our view" statement in `Manifesto.astro`, architecture demo, timeline, values, footer in
  `SiteFooter.astro`).

All animations respect the visitor's "reduce motion" setting.

## Founder photos

`public/founders/` holds the photos shown on the site: each founder cut out of the original photo and placed on
the site's night background. The originals are in `assets-src/founders-original/`.

To give a new photo the same treatment, use `assets-src/portraits.py`. It needs Python with `numpy`, `pillow` and
`onnxruntime`, plus the ISNet background-removal model (`isnet-general-use.onnx`, about 170 MB, from the
[rembg releases](https://github.com/danielgatis/rembg/releases/tag/v0.0.0)):

```
python assets-src/portraits.py assets-src/founders-original public/founders isnet-general-use.onnx
```

It processes every `.webp` in the source folder, writes 800 × 800 images, and also saves each cut-out mask as a
`-mask.png` next to the output (these are not needed by the site).

## Archive

Earlier designs live under `/archive` (index at `src/pages/archive/index.astro`): the original Destiny Valley
homepage, variations 1 to 9, and the Nuvareth directions 10 to 15. They use their own layouts and styles
(`src/layouts/Base.astro`, `src/layouts/Variant.astro`, `src/styles/global.css`) and are not linked from the live site.

## Deploy

`dist/` is plain static files. Cloudflare Pages, Netlify, Vercel or any static host will serve it; the build command
is `npm run build` and the output directory is `dist`.
