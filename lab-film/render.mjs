// Capture a lab piece as a video. The page's film mode (?film) advances the scene one video frame at a time,
// so the result is identical on every run and never drops a frame.
//
//   npm run dev                                   (in another terminal)
//   python lab-film/voice.py <work_dir>           (narration.wav + timings.json)
//   node lab-film/render.mjs <work_dir> <out.mp4> [wide|tall] [seconds]
//
// wide = 1920x1080, tall = 1080x1920. `seconds` cuts the capture short for a quick look.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const [work, out, format = 'wide', limit] = process.argv.slice(2);
if (!work || !out) {
  console.error('usage: node lab-film/render.mjs <work_dir> <out.mp4> [wide|tall] [seconds]');
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const film = JSON.parse(readFileSync(join(root, 'src/lab/desk/film.json'), 'utf8'));
const timings = JSON.parse(readFileSync(join(work, 'timings.json'), 'utf8'));
const FPS = 30;
const view = format === 'tall' ? { width: 540, height: 960, deviceScaleFactor: 2 } : { width: 1280, height: 720, deviceScaleFactor: 1.5 };
const url = process.env.LAB_URL ?? 'http://localhost:4321/lab/context-window?film';
const chrome = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const seconds = limit ? Math.min(+limit, timings.duration) : timings.duration;
const frames = Math.round(seconds * FPS);

const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--hide-scrollbars', '--force-color-profile=srgb'] });
const page = await browser.newPage();
await page.setViewport(view);
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate((starts, lines) => window.__film.load(starts, lines), timings.starts, film.lines);

const ff = spawn(
  'ffmpeg',
  ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', join(work, 'narration.wav'),
   '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
   '-t', String(seconds), '-movflags', '+faststart', out],
  { stdio: ['pipe', 'inherit', 'inherit'] },
);
const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())));

for (let f = 0; f < frames; f++) {
  await page.evaluate(() => window.__film.tick(2));
  const png = await page.screenshot({ type: 'png', optimizeForSpeed: true });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log(`${(f / FPS).toFixed(0)} / ${seconds.toFixed(0)} s`);
}
ff.stdin.end();
await done;
await browser.close();
console.log('wrote', out);
