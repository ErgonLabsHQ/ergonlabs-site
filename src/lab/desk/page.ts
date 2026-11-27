// Page behaviour for /lab/context-window: the scroll-driven story and the sandbox.
import { Convo, story, tokenize, CAP, QUESTION, type Mode, type Msg, type Role } from './convo';
import { Desk, DEPTH, type Hover } from './engine';

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const mobile = () => innerWidth < 900;
/** right edge of the story's text column, in px from the left of the viewport */
const textEdge = () => Math.max(18, (innerWidth - 1102) / 2) + Math.min(430, innerWidth * 0.36);
const FILM = new URLSearchParams(location.search).has('film');
if (FILM) document.documentElement.classList.add('film');

function esc(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
}

function meter(c: Convo, used: HTMLElement | null, cap: HTMLElement | null, bar: HTMLElement | null) {
  const n = c.used();
  if (used) used.textContent = String(n);
  if (cap) cap.textContent = String(c.cap);
  if (bar) {
    bar.style.transform = `scaleX(${Math.min(1, n / c.cap)})`;
    bar.classList.toggle('full', n / c.cap > 0.93);
  }
}

const ROLE: Record<Role, string> = { system: 'Instructions', user: 'You', ai: 'Assistant', summary: 'Summary' };
function tip(el: HTMLElement | null, h: Hover | null) {
  if (!el) return;
  if (!h) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.innerHTML = `<b>${ROLE[h.msg.role]}</b><span>${esc(h.tok.trim() || '␣')}</span>`;
  el.style.transform = `translate(${Math.round(h.x)}px, ${Math.round(h.y)}px) translate(-50%, -100%) translateY(-14px)`;
}

/** Put the speech bubble above the owl, kept inside the stage, with its tail pointing at the owl. */
function placeBubble(bubble: HTMLElement, desk: Desk, lean: number) {
  const [x, y] = desk.owlHead();
  const w = bubble.offsetWidth;
  const left = Math.max(12, Math.min(desk.W - w - 12, x - w * lean));
  bubble.style.transform = `translate(${Math.round(left)}px, ${Math.round(y)}px) translateY(-100%) translateY(-14px)`;
  bubble.style.setProperty('--tail', `${Math.round(Math.max(16, Math.min(w - 16, x - left)))}px`);
}

// ---------------------------------------------------------------------------------------------------------
// The story

interface Step {
  upto: number;
  mode?: Partial<Mode>;
  /** columns to frame; default the whole window */
  cam?: [number, number];
  glow?: boolean;
  /** what plays when the step is entered going down: turn numbers to add, or 'scan' */
  play: (number | 'scan')[];
  note?: string;
}

const STEPS: Step[] = [
  { upto: -1, play: [-1] },
  { upto: 0, cam: [0, 9], glow: true, play: [0] },
  { upto: 3, cam: [0, 13], play: ['scan', 1, 2, 'scan', 3] },
  { upto: 5, play: [4, 'scan', 5] },
  { upto: 6, play: [6] },
  { upto: 9, play: [7, 8, 'scan', 9], note: 'The allergy was not in the window.' },
  { upto: 9, mode: { pin: true }, glow: true, play: [8, 'scan', 9], note: 'The note was in the window.' },
  { upto: 9, mode: { sum: true }, glow: true, play: [8, 'scan', 9], note: 'The summary kept the allergy.' },
  { upto: 9, mode: { store: true }, glow: true, play: [7, 8, 'scan', 9], note: 'The search brought the allergy back.' },
];

function initStory() {
  const stage = $('[data-stage]');
  const canvas = $<HTMLCanvasElement>('[data-canvas]');
  if (!stage || !canvas) return;
  const desk = new Desk(canvas);
  const strip = $('[data-strip]');
  const bubble = $('[data-bubble]');
  const bubbleText = $('[data-bubble-text]');
  const bubbleNote = $('[data-bubble-note]');
  const tag = $('[data-tag]');
  const tipEl = $('[data-tip]');
  const used = $('[data-used]');
  const capEl = $('[data-cap]');
  const bar = $('[data-bar]');
  let cur = -1;
  let shown: Convo | null = null;
  let tagMode: 'fact' | 'none' = 'none';

  const insets = () => {
    desk.inset = FILM
      ? mobile()
        ? { l: 16, r: 16, t: 300, b: 150 }
        : { l: innerWidth * 0.48, r: 120, t: 130, b: 120 }
      : mobile()
        ? { l: 14, r: 14, t: 86, b: Math.round(innerHeight * 0.4) }
        : { l: textEdge() + 110, r: 150, t: 170, b: 130 };
  };
  insets();

  const show = (c: Convo, answer?: string, note?: string, opts: { instant?: boolean } = {}) => {
    shown = c;
    desk.sync(c, opts);
    meter(c, used, capEl, bar);
    // the newest message, with its token boundaries
    if (strip) {
      const w = c.window();
      const m = w[w.length - 1];
      strip.innerHTML = m
        ? `<b>${ROLE[m.role]}</b>` + m.toks.map((t, i) => `<span class="${m.fact && i >= m.fact[0] && i < m.fact[1] ? 'f' : ''}">${esc(t)}</span>`).join('')
        : '';
      strip.dataset.role = m?.role ?? '';
    }
    if (bubble && bubbleText && bubbleNote) {
      bubble.hidden = !answer;
      if (answer) {
        bubbleText.textContent = answer;
        bubbleNote.textContent = note ?? '';
        bubble.classList.toggle('bad', !c.factVisible());
        bubble.classList.remove('in');
        void bubble.offsetWidth;
        bubble.classList.add('in');
      }
    }
  };

  const frame = (s: Step, snap = false) => {
    const all: [number, number] = [0, Math.ceil(CAP / DEPTH)];
    const [a, b] = mobile() ? all : (s.cam ?? all);
    desk.frame(a, b, !!s.mode?.store, snap);
    desk.setGlow(!!s.glow);
    tagMode = s.glow ? 'fact' : 'none';
  };

  const goto = (i: number, instant = false) => {
    if (i === cur) return;
    const forward = i === cur + 1 && !instant && !desk.reduce;
    cur = i;
    const s = STEPS[i];
    desk.cancel();
    frame(s, instant);
    if (!forward) {
      const { c, answer } = story(s.upto, s.mode);
      show(c, answer, s.note, { instant });
      return;
    }
    let t = 0;
    for (const beat of s.play) {
      if (beat === 'scan') {
        desk.after(t, () => desk.scan(1.15));
        t += 1.35;
      } else {
        const { c, answer } = story(beat, s.mode);
        const w = c.window();
        const fresh = w[w.length - 1]?.toks.length ?? 0;
        desk.after(t, () => show(c, answer, s.note));
        t += 0.45 + fresh * 0.032;
      }
    }
  };

  // labels that follow things in the scene
  desk.onFrame = () => {
    if (bubble && !bubble.hidden) {
      placeBubble(bubble, desk, mobile() ? 0.84 : 0.42);
    }
    if (tag) {
      const p = tagMode === 'fact' ? desk.factAnchor() : null;
      tag.hidden = !p;
      if (p) {
        tag.textContent = 'allergic to peanuts';
        tag.style.transform = `translate(${Math.round(p[0])}px, ${Math.round(p[1])}px) translate(-50%, -100%) translateY(-52px)`;
      }
    }
  };
  desk.onHover = (h) => tip(tipEl, h);

  if (FILM) {
    goto(0, true);
    return { desk, show, frame };
  }
  const stepEls = [...document.querySelectorAll<HTMLElement>('[data-step]')];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = stepEls.indexOf(e.target as HTMLElement);
        stepEls.forEach((el, k) => el.classList.toggle('on', k === i));
        goto(i);
      }
    },
    { rootMargin: '-48% 0px -48% 0px' },
  );
  stepEls.forEach((el) => io.observe(el));

  // run only while on screen
  new IntersectionObserver(([e]) => (e.isIntersecting ? desk.start() : desk.stop())).observe(stage);
  addEventListener('resize', () => {
    insets();
    desk.resize();
    if (cur >= 0) frame(STEPS[cur], true);
  });

  goto(0, true);
  stepEls[0]?.classList.add('on');
  desk.draw();
  return { desk, show, frame };
}

// ---------------------------------------------------------------------------------------------------------
// Film: the same scene driven by the narration's timeline (film.json), advanced one video frame at a time by
// the capture script (lab-film/render.mjs). Nothing here depends on the wall clock.

type Cue = [number, string, ...unknown[]];
function initFilm(api: NonNullable<ReturnType<typeof initStory>>) {
  const { desk, show, frame } = api;
  const cap = $('[data-cap]');
  const capChip = $('[data-cap-chip]');
  const capH = $('[data-cap-h]');
  const capSub = $('[data-cap-sub]');
  let queue: { t: number; cue: Cue }[] = [];
  let capAt = -9;
  let glow = false;
  let cam: [number, number, boolean] = [0, 18, false];
  const NOTE: Record<string, string> = {
    '': 'The allergy was not in the window.',
    pin: 'The note was in the window.',
    sum: 'The summary kept the allergy.',
    store: 'The search brought the allergy back.',
  };
  const look = () => frame({ upto: 0, cam: [cam[0], cam[1]], glow, mode: cam[2] ? { store: true } : undefined, play: [] });
  const run = (c: Cue) => {
    const [, what, a, b, d] = c;
    if (what === 'story') {
      const name = (b as string) ?? '';
      const { c: convo, answer } = story(a as number, name ? { [name]: true } : {});
      show(convo, answer, NOTE[name]);
    } else if (what === 'scan') desk.scan(1.15);
    else if (what === 'cam') {
      cam = [a as number, b as number, !!d];
      look();
    } else if (what === 'glow') {
      glow = !!a;
      look();
    } else if (what === 'cap' && cap && capChip && capH && capSub) {
      capChip.textContent = (a as string) ?? '';
      capChip.hidden = !a;
      capH.textContent = (b as string) ?? '';
      capSub.textContent = (d as string) ?? '';
      capSub.hidden = !d;
      capAt = desk.time;
    }
  };
  const film = {
    /** line start times in seconds, from the measured narration */
    load(starts: number[], lines: { cues: Cue[] }[]) {
      queue = [];
      lines.forEach((l, i) => l.cues.forEach((cue) => queue.push({ t: starts[i] + cue[0], cue })));
      queue.sort((x, y) => x.t - y.t);
      desk.time = 0;
    },
    /** advance by one video frame (n scene steps), then draw */
    tick(n = 2) {
      for (let i = 0; i < n; i++) {
        while (queue.length && queue[0].t <= desk.time) run(queue.shift()!.cue);
        desk.step();
      }
      if (cap) {
        const k = Math.min(1, Math.max(0, (desk.time - capAt) / 0.45));
        const e = 1 - Math.pow(1 - k, 3);
        cap.style.opacity = String(e);
        cap.style.transform = `translateY(${(1 - e) * 14}px)`;
      }
      desk.draw();
      return desk.time;
    },
  };
  (window as unknown as Record<string, unknown>).__film = film;
}

// ---------------------------------------------------------------------------------------------------------
// The sandbox

type ModeName = 'drop' | 'pin' | 'sum' | 'store';
const SMALL: [string, string][] = [
  ['Is the hotel close to the tram?', 'The 28 tram stops two streets away and runs until 11 at night.'],
  ['What is the weather like in June?', 'Dry and around 25 degrees by day. Pack a light jacket for the evenings by the river.'],
  ['Can we get a late checkout on the 10th?', 'Asked. They can hold the room until 2 in the afternoon at no charge.'],
  ['How do we get from the airport?', 'The metro red line takes 25 minutes to the centre. A taxi is about 15 euros.'],
  ['Is one day enough for Sintra?', 'Yes, if you start early. Pena Palace first, then the old town for lunch.'],
];

function initSandbox() {
  const root = $('[data-sandbox]');
  const canvas = $<HTMLCanvasElement>('[data-sb-canvas]');
  const stage = $('[data-sb-stage]');
  if (!root || !canvas || !stage) return;
  const desk = new Desk(canvas);
  const log = $('[data-sb-log]')!;
  const capIn = $<HTMLInputElement>('[data-sb-cap]')!;
  const capOut = $('[data-sb-cap-out]');
  const bubble = $('[data-sb-bubble]');
  const bubbleText = $('[data-sb-bubble-text]');
  const tipEl = $('[data-sb-tip]');
  let mode: ModeName = 'drop';
  let cap = CAP;
  let small = 0;
  let busy = false;
  /** every turn so far, as typed: replayed whenever a setting changes */
  let turns: { role: Role; text: string }[] = [];
  let convo: Convo;

  const first = () => {
    turns = [
      { role: 'user', text: "Hi! We're planning a week in Lisbon. One thing first: I'm allergic to peanuts." },
      { role: 'ai', text: 'Noted, no peanuts. When do you fly?' },
    ];
    small = 0;
  };

  const replay = () => {
    const c = new Convo(cap, { pin: mode === 'pin', sum: mode === 'sum', store: mode === 'store' });
    c.add('system', 'You are a travel assistant for Ergon Trips. Keep answers short.', { pinned: true, id: 'sys' });
    turns.forEach((t, i) => {
      c.add(t.role, t.text, { id: `u${i}`, fact: i === 0 ? 'allergic to peanuts' : undefined });
      if (i === 0 && c.mode.pin) c.add('system', 'Keep in mind: allergic to peanuts.', { pinned: true, fact: 'allergic to peanuts', id: 'note' });
    });
    return c;
  };

  const paint = (instant = false) => {
    desk.inset = mobile() ? { l: 12, r: 12, t: 60, b: 20 } : { l: 36, r: 36, t: 96, b: 40 };
    desk.setCap(convo.cap);
    desk.frame(0, Math.ceil(convo.cap / DEPTH), mode === 'store');
    desk.sync(convo, { instant });
    meter(convo, $('[data-sb-used]'), $('[data-sb-capn]'), $('[data-sb-bar]'));
    const inWin = new Set(convo.window().map((m) => m.id));
    log.innerHTML = convo.msgs
      .filter((m) => m.id !== 'sys')
      .map((m) => {
        const sent = inWin.has(m.id);
        const state = sent ? (m.retrieved ? 'fetched back' : m.pinned ? 'pinned' : '') : m.where === 'store' ? 'in the store' : m.where === 'folded' ? 'in the summary' : 'not sent';
        return `<li class="r-${m.role}${sent ? '' : ' out'}"><span>${ROLE[m.role]}${state ? ` · ${state}` : ''} · ${m.toks.length}</span><p>${esc(m.text)}</p></li>`;
      })
      .join('');
    log.scrollTop = log.scrollHeight;
  };

  const rebuild = (instant = false) => {
    convo = replay();
    paint(instant);
  };

  const say = (text: string, forced?: string) => {
    text = text.trim();
    if (!text || busy) return;
    busy = true;
    root.classList.add('busy');
    if (bubble) bubble.hidden = true;
    turns.push({ role: 'user', text });
    rebuild();
    if (mode === 'store') {
      convo.retrieveFor(text);
      desk.after(0.5, () => paint());
    }
    const wait = 0.5 + tokenize(text).length * 0.032 + (mode === 'store' ? 0.6 : 0);
    desk.after(wait, () => desk.scan(1.0));
    desk.after(wait + 1.2, () => {
      const answer = forced ?? convo.reply(text);
      const fetched = convo.msgs.filter((m) => m.retrieved).map((m) => m.id);
      turns.push({ role: 'ai', text: answer });
      convo = replay();
      // keep fetched turns in view for the reply that used them
      for (const m of convo.msgs) {
        if (fetched.includes(m.id) && m.where === 'store') {
          m.where = 'window';
          m.retrieved = true;
        }
      }
      convo.trim();
      paint();
      if (bubble && bubbleText) {
        bubbleText.textContent = answer;
        bubble.hidden = false;
        bubble.classList.remove('in');
        void bubble.offsetWidth;
        bubble.classList.add('in');
      }
      busy = false;
      root.classList.remove('busy');
    });
  };

  desk.onFrame = () => {
    if (bubble && !bubble.hidden) {
      placeBubble(bubble, desk, 0.84);
    }
  };
  desk.onHover = (h) => tip(tipEl, h);

  capIn.addEventListener('input', () => {
    cap = +capIn.value;
    if (capOut) capOut.textContent = String(cap);
    if (!busy) rebuild();
  });
  root.querySelectorAll<HTMLButtonElement>('[data-sb-mode]').forEach((b) =>
    b.addEventListener('click', () => {
      if (busy) return;
      mode = b.dataset.sbMode as ModeName;
      root.querySelectorAll('[data-sb-mode]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      if (bubble) bubble.hidden = true;
      rebuild();
    }),
  );
  root.querySelectorAll<HTMLButtonElement>('[data-sb-say]').forEach((b) => b.addEventListener('click', () => say(b.dataset.sbSay!)));
  $('[data-sb-chat]', root)?.addEventListener('click', () => {
    const [q, a] = SMALL[small++ % SMALL.length];
    say(q, a);
  });
  $<HTMLFormElement>('[data-sb-form]', root)?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).elements.namedItem('q') as HTMLInputElement;
    say(input.value);
    input.value = '';
  });
  $('[data-sb-reset]', root)?.addEventListener('click', () => {
    if (busy) return;
    first();
    if (bubble) bubble.hidden = true;
    rebuild();
  });

  new IntersectionObserver(([e]) => (e.isIntersecting ? desk.start() : desk.stop())).observe(stage);
  addEventListener('resize', () => {
    desk.resize();
    paint(true);
  });

  first();
  rebuild(true);
  desk.frame(0, Math.ceil(cap / DEPTH), false, true);
  desk.draw();
}

const storyApi = initStory();
if (FILM && storyApi) initFilm(storyApi);
else initSandbox();
// for film capture and debugging
(window as unknown as Record<string, unknown>).__cw = { storyApi, story, QUESTION };
export type { Msg };
