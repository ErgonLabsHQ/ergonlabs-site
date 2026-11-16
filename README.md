# Destiny Valley site

One-page Astro site. Static output, no framework runtime, a few kB of JavaScript.

## Run it

```
npm install
npm run dev        # http://localhost:4321
npm run build      # writes ./dist
npm run preview    # serves ./dist
```

## Change the content

All text, services, FAQs and contact details are in `src/site.ts`. Before going live:

1. Set `name`, `email`, `location` and the `socials` links. They are placeholders.
2. Set `bookingUrl` to a Cal.com or Calendly link if you want the main buttons to open a calendar.
3. Set `site` in `astro.config.mjs` to the real domain.
4. Read every claim in `src/site.ts` and keep only what is true for your team (more than ten years of experience, work at leading companies since 2018, ML and game engine expertise, reply within one working day, a demo every week, month-to-month terms, fixing problems day or night after launch).

The contact form opens the visitor's mail app with the message filled in. To receive submissions directly, point the
form in `src/components/Contact.astro` at a form service or your own endpoint.

## Where things are

- `src/components/Hero.astro`: the pinned opening. A pixel-art valley is drawn on a small canvas and scaled up;
  scrolling builds a bridge across it in four stages, one per step in `process` (in `src/site.ts`). The stage
  boundaries are the `bounds` array in the script, and the drawing is the `draw` function.
- `src/components/Services.astro`: the service list (click a row to open it).
- `src/components/AgentDemo.astro`: three example panels (an agent run, a bug fix, a six-week project) that advance on
  a timer. Their content is illustrative and lives at the top of that file.
- `src/components/Engagements.astro`: the four ways of working and the house rules.
- `src/styles/global.css`: colours, type and shared styles. The palette is `--paper`, `--ink`, `--blue`, `--sun`,
  `--mint` and `--coral`; the scene in `Hero.astro` repeats those colours as constants.

The previous look is kept in `../agency-site-previous-look/` in case you want anything back from it.

## Deploy

`dist/` is plain static files. Cloudflare Pages, Netlify, Vercel or any static host will serve it; the build command
is `npm run build` and the output directory is `dist`.
