// Drawing engine for "The context window". One canvas, an isometric world in the site's hairline style:
// a wireframe box (the window), one small tile per token, and the owl reading them.
//
// The engine is declarative: hand it a Convo with sync() and every tile springs to where it now belongs.
// New tokens drop in, dropped turns are swept off the front edge, folded turns fly into the summary, stored
// turns settle on the tray. All motion runs on a fixed-step clock so a film can be captured frame by frame.

import type { Convo, Msg } from './convo';

const C = Math.cos(Math.PI / 6);
const S = 0.5;
/** tiles across the window (its depth) */
export const DEPTH = 6;
const FRAME_H = 1.75;
const TILE = 0.8;
const TILE_H = 0.4;
const DT = 1 / 60;

type Tone = 'user' | 'ai' | 'system' | 'fact' | 'summary';
type State = 'live' | 'fall' | 'merge';

interface Ent {
  key: string;
  msg: string;
  idx: number;
  tok: string;
  tone: Tone;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  tx: number;
  ty: number;
  tz: number;
  a: number;
  delay: number;
  state: State;
  stored: boolean;
  col: number;
  hot: number;
}

export interface Hover {
  msg: Msg;
  tok: string;
  x: number;
  y: number;
}

const PAL: Record<Tone, { top: string; left: string; right: string; line: string }> = {
  user: { top: '#f3f3f3', left: '#c6c6c6', right: '#a3a3a3', line: 'rgba(0,0,0,0.42)' },
  ai: { top: '#7d7d7d', left: '#606060', right: '#4c4c4c', line: 'rgba(0,0,0,0.5)' },
  system: { top: '#2b2b2b', left: '#272727', right: '#242424', line: 'rgba(255,255,255,0.6)' },
  fact: { top: '#f5a524', left: '#cf8616', right: '#a96c0e', line: 'rgba(0,0,0,0.45)' },
  summary: { top: '#dcdcdc', left: '#b2b2b2', right: '#939393', line: 'rgba(0,0,0,0.42)' },
};

function dimmed(hex: string) {
  if (!hex.startsWith('#')) return hex;
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c * 0.5 + 0x23 * 0.5);
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}
const PAL_DIM = Object.fromEntries(
  Object.entries(PAL).map(([k, v]) => [k, { top: dimmed(v.top), left: dimmed(v.left), right: dimmed(v.right), line: k === 'system' ? 'rgba(255,255,255,0.3)' : v.line }]),
) as typeof PAL;

const OWL = {
  earL: new Path2D('M12 22 L13 3 L24 13 Z'),
  earR: new Path2D('M52 22 L51 3 L40 13 Z'),
  wingL: new Path2D('M11 44 C8 56 11 68 19 74 C17 64 17 54 19 44 Z'),
  wingR: new Path2D('M53 44 C56 56 53 68 45 74 C47 64 47 54 45 44 Z'),
  chev: new Path2D(
    'M24 50l2 2 2-2M30 50l2 2 2-2M36 50l2 2 2-2M23.5 56l2 2 2-2M29.5 56l2 2 2-2M35.5 56l2 2 2-2M26 62l2 2 2-2M33 62l2 2 2-2',
  ),
  brow: new Path2D('M13.5 18.5 Q22 16.5 30 21.5M50.5 18.5 Q42 16.5 34 21.5'),
  beak: new Path2D('M29.5 33 L34.5 33 L32 39 Z'),
  feet: new Path2D('M25 74v4M23 74.5l-1.5 3.5M27 74.5l1.5 3.5M39 74v4M37 74.5l-1.5 3.5M41 74.5l1.5 3.5'),
};

export class Desk {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  W = 0;
  H = 0;
  dpr = 1;
  time = 0;
  cols = 18;
  ents = new Map<string, Ent>();
  convo: Convo | null = null;
  cam = { x: 0, y: 0, z: 30, tx: 0, ty: 0, tz: 30, vx: 0, vy: 0, vz: 0 };
  /** viewport insets in css px that the framing keeps clear (text column, panels) */
  inset = { l: 24, r: 24, t: 24, b: 24 };
  private look: { x0: number; x1: number; store: boolean } = { x0: 0, x1: 18, store: false };
  private scanAt: { t0: number; dur: number; to: number } | null = null;
  private queue: { at: number; fn: () => void }[] = [];
  private acc = 0;
  private last = 0;
  private raf = 0;
  private pointer: { x: number; y: number } | null = null;
  private hoverMsg: string | null = null;
  private showStore = 0;
  private storeOn = false;
  private glow = 0;
  private glowTarget = 0;
  private leanX = 0;
  private leanY = 0;
  reduce = false;
  running = false;
  onFrame: (() => void) | null = null;
  onHover: ((h: Hover | null) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resize();
    canvas.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top };
    });
    canvas.addEventListener('pointerleave', () => (this.pointer = null));
  }

  // ---- size and camera -------------------------------------------------------------------------------

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    this.canvas.width = Math.round(this.W * this.dpr);
    this.canvas.height = Math.round(this.H * this.dpr);
    this.frame(this.look.x0, this.look.x1, this.look.store, true);
  }

  setCap(cap: number) {
    this.cols = Math.ceil(cap / DEPTH);
  }

  /** Point the camera at columns x0..x1 of the window (and the store tray when asked). */
  frame(x0: number, x1: number, store = false, snap = false) {
    this.look = { x0, x1, store };
    const pts: [number, number][] = [];
    for (const x of [x0, x1]) for (const y of [0, DEPTH]) for (const z of [0, FRAME_H + 0.2]) pts.push(iso(x, y, z));
    // room for the owl on the far corner
    if (x1 >= this.cols - 0.5) pts.push(iso(this.cols + 1.6, 0, FRAME_H + 3.9), iso(this.cols + 1.8, 0, 0));
    if (store) for (const [x, y] of [[STORE.x - 0.6, STORE.y + STORE.d + 0.4], [STORE.x + STORE.w, STORE.y + STORE.d + 0.6]] as const) pts.push(iso(x, y, 0));
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const bw = Math.max(...xs) - Math.min(...xs);
    const bh = Math.max(...ys) - Math.min(...ys);
    const aw = Math.max(80, this.W - this.inset.l - this.inset.r);
    const ah = Math.max(80, this.H - this.inset.t - this.inset.b);
    const z = Math.min(aw / bw, ah / bh, 92);
    const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
    const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    // camera centre is offset so the framed box sits in the middle of the clear area
    this.cam.tz = z;
    this.cam.tx = cx - (this.inset.l - this.inset.r) / 2 / z;
    this.cam.ty = cy - (this.inset.t - this.inset.b) / 2 / z;
    if (snap || this.reduce) {
      this.cam.x = this.cam.tx;
      this.cam.y = this.cam.ty;
      this.cam.z = this.cam.tz;
      this.cam.vx = this.cam.vy = this.cam.vz = 0;
    }
  }

  /** world -> css px */
  project(x: number, y: number, z = 0): [number, number] {
    const [px, py] = iso(x, y, z);
    return [this.W / 2 + (px - this.cam.x) * this.cam.z + this.leanX, this.H / 2 + (py - this.cam.y) * this.cam.z + this.leanY];
  }

  // ---- state ------------------------------------------------------------------------------------------

  /** Make the scene match the conversation. Tiles are keyed by message and token, so they move, not redraw. */
  sync(convo: Convo, opts: { instant?: boolean; stagger?: number; wait?: number } = {}) {
    this.convo = convo;
    this.setCap(convo.cap);
    const instant = opts.instant || this.reduce;
    const stagger = opts.stagger ?? 0.032;
    const seen = new Set<string>();
    let slot = 0;
    let fresh = 0;
    const place = (m: Msg, i: number, tx: number, ty: number, tz: number, stored: boolean, col: number) => {
      const key = `${m.id}:${i}`;
      seen.add(key);
      const tone: Tone = m.fact && i >= m.fact[0] && i < m.fact[1] ? 'fact' : m.role === 'summary' ? 'summary' : (m.role as Tone);
      let e = this.ents.get(key);
      if (!e) {
        e = { key, msg: m.id, idx: i, tok: m.toks[i], tone, x: tx, y: ty, z: tz + 4.5, vx: 0, vy: 0, vz: 0, tx, ty, tz, a: 0, delay: (opts.wait ?? 0) + fresh * stagger, state: 'live', stored, col, hot: 0 };
        fresh++;
        this.ents.set(key, e);
      } else if (e.state !== 'live') {
        // coming back (fetched from the store while still leaving)
        e.state = 'live';
        e.delay = 0;
      }
      e.tok = m.toks[i];
      e.tone = tone;
      e.tx = tx;
      e.ty = ty;
      e.tz = tz;
      e.stored = stored;
      e.col = col;
      if (instant) {
        e.x = tx;
        e.y = ty;
        e.z = tz;
        e.a = 1;
        e.delay = 0;
        e.vx = e.vy = e.vz = 0;
      }
    };
    for (const m of convo.window()) {
      for (let i = 0; i < m.toks.length; i++, slot++) {
        const col = Math.floor(slot / DEPTH);
        // columns run back and forth, so neighbouring tokens stay next to each other
        const d = slot % DEPTH;
        place(m, i, col + 0.5, (col % 2 ? DEPTH - 1 - d : d) + 0.5, 0, false, col);
      }
    }
    let k = 0;
    const stored = convo.stored();
    for (const m of stored) {
      for (let i = 0; i < m.toks.length; i++, k++) {
        const per = STORE.nx * STORE.ny;
        place(m, i, STORE.x + 0.5 + (k % STORE.nx) * 0.86, STORE.y + 0.5 + (Math.floor(k / STORE.nx) % STORE.ny) * 0.86, 0.06 + Math.floor(k / per) * (TILE_H + 0.06), true, -1);
      }
    }
    this.storeOn = convo.mode.store || stored.length > 0;
    // whatever is no longer sent leaves the scene
    const sumAt = this.ents.get('sum:0');
    let leaving = 0;
    for (const e of this.ents.values()) {
      if (seen.has(e.key) || e.state !== 'live') continue;
      if (instant) {
        this.ents.delete(e.key);
        continue;
      }
      const m = convo.msgs.find((x) => x.id === e.msg);
      if (m?.where === 'folded' && sumAt) {
        e.state = 'merge';
        e.tx = sumAt.tx + 0.4;
        e.ty = DEPTH / 2;
        e.tz = 0.3;
        e.delay = leaving * 0.008;
      } else {
        e.state = 'fall';
        e.delay = leaving * 0.022;
        e.vx = 0;
        e.vy = 0;
        e.vz = 0;
      }
      leaving++;
    }
  }

  /** The model reads the whole window from the start: a sweep across every tile. Resolves when it ends. */
  scan(dur = 1.1): number {
    const to = Math.ceil((this.convo?.used() ?? 0) / DEPTH) + 0.5;
    if (this.reduce) return 0;
    this.scanAt = { t0: this.time, dur, to };
    return dur;
  }

  /** Run something later on the scene clock. */
  after(delay: number, fn: () => void) {
    this.queue.push({ at: this.time + (this.reduce ? 0 : delay), fn });
  }
  cancel() {
    this.queue = [];
    this.scanAt = null;
  }
  /** tint the fact tiles' surroundings when the story points at them */
  setGlow(on: boolean) {
    this.glowTarget = on ? 1 : 0;
  }

  // ---- clock ------------------------------------------------------------------------------------------

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const tick = (now: number) => {
      if (!this.running) return;
      this.acc += Math.min(0.1, (now - this.last) / 1000);
      this.last = now;
      while (this.acc >= DT) {
        this.step();
        this.acc -= DT;
      }
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  /** Advance the scene by one sixtieth of a second. */
  step() {
    this.time += DT;
    if (this.queue.length) {
      const due = this.queue.filter((q) => q.at <= this.time);
      if (due.length) {
        this.queue = this.queue.filter((q) => q.at > this.time);
        for (const q of due) q.fn();
      }
    }
    const cam = this.cam;
    for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty'], ['z', 'vz', 'tz']] as const) {
      const a = (cam[t] - cam[p]) * 28 - cam[v] * 10.5;
      cam[v] += a * DT;
      cam[p] += cam[v] * DT;
    }
    this.showStore += ((this.storeOn ? 1 : 0) - this.showStore) * Math.min(1, DT * 5);
    this.glow += (this.glowTarget - this.glow) * Math.min(1, DT * 4);
    if (this.scanAt && this.time > this.scanAt.t0 + this.scanAt.dur + 0.4) this.scanAt = null;

    for (const e of this.ents.values()) {
      if (e.delay > 0) {
        e.delay -= DT;
        continue;
      }
      if (e.state === 'live') {
        const k = 150;
        const c = 19;
        e.vx += ((e.tx - e.x) * k - e.vx * c) * DT;
        e.vy += ((e.ty - e.y) * k - e.vy * c) * DT;
        e.vz += ((e.tz - e.z) * k - e.vz * c) * DT;
        e.x += e.vx * DT;
        e.y += e.vy * DT;
        e.z += e.vz * DT;
        e.a += (1 - e.a) * Math.min(1, DT * 9);
      } else if (e.state === 'fall') {
        // swept off the front edge of the window, then gravity
        if (e.y < DEPTH + 0.7) e.vy += 34 * DT;
        else e.vz -= 30 * DT;
        e.vy *= 0.985;
        e.y += e.vy * DT;
        e.z += e.vz * DT;
        if (e.z < -3) e.a -= DT * 2.2;
        if (e.a <= 0 || e.z < -16) this.ents.delete(e.key);
      } else {
        e.x += (e.tx - e.x) * Math.min(1, DT * 7);
        e.y += (e.ty - e.y) * Math.min(1, DT * 7);
        e.z += (e.tz - e.z) * Math.min(1, DT * 7);
        if (Math.abs(e.tx - e.x) < 0.9) e.a -= DT * 5;
        if (e.a <= 0) this.ents.delete(e.key);
      }
    }
  }

  // ---- drawing ---------------------------------------------------------------------------------------

  draw() {
    const { ctx, W, H, dpr, cam } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // the scene leans a little towards the pointer
    const lean = this.pointer && !this.reduce ? [(this.pointer.x / W - 0.5) * -14, (this.pointer.y / H - 0.5) * -9] : [0, 0];
    this.leanX += (lean[0] - this.leanX) * 0.06;
    this.leanY += (lean[1] - this.leanY) * 0.06;
    const ox = W / 2 - cam.x * cam.z + this.leanX;
    const oy = H / 2 - cam.y * cam.z + this.leanY;
    const u = cam.z;
    const X = (x: number, y: number, z = 0) => ox + (x - y) * C * u;
    const Y = (x: number, y: number, z = 0) => oy + ((x + y) * S - z) * u;
    const poly = (pts: [number, number, number][]) => {
      ctx.beginPath();
      pts.forEach(([x, y, z], i) => (i ? ctx.lineTo(X(x, y, z), Y(x, y, z)) : ctx.moveTo(X(x, y, z), Y(x, y, z))));
    };
    const seg = (a: [number, number, number], b: [number, number, number]) => {
      ctx.moveTo(X(...a), Y(...a));
      ctx.lineTo(X(...b), Y(...b));
    };
    const cols = this.cols;
    ctx.lineJoin = 'round';

    // floor grid, fading out with distance from the window
    ctx.lineWidth = 1;
    const gx0 = -9;
    const gx1 = cols + 9;
    const gy0 = -8;
    const gy1 = DEPTH + 12;
    const mid = [X(cols / 2, DEPTH / 2), Y(cols / 2, DEPTH / 2)];
    const fade = ctx.createRadialGradient(mid[0], mid[1], u * 3, mid[0], mid[1], u * (cols * 0.62 + 6));
    fade.addColorStop(0, 'rgba(255,255,255,0.085)');
    fade.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = fade;
    ctx.beginPath();
    for (let x = gx0; x <= gx1; x++) seg([x, gy0, 0], [x, gy1, 0]);
    for (let y = gy0; y <= gy1; y++) seg([gx0, y, 0], [gx1, y, 0]);
    ctx.stroke();

    // the window's floor and its slot marks
    poly([[0, 0, 0], [cols, 0, 0], [cols, DEPTH, 0], [0, DEPTH, 0]]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    const used = this.convo ? this.convo.used() : 0;
    for (let s = used; s < cols * DEPTH; s++) {
      const sc = Math.floor(s / DEPTH);
      const cx = sc + 0.5;
      const cy = (sc % 2 ? DEPTH - 1 - (s % DEPTH) : s % DEPTH) + 0.5;
      ctx.fillRect(X(cx, cy) - 1, Y(cx, cy) - 1, 2, 2);
    }

    // back edges of the frame
    const line = 'rgba(239,239,239,0.62)';
    const dim = 'rgba(239,239,239,0.26)';
    ctx.strokeStyle = dim;
    ctx.beginPath();
    seg([0, 0, 0], [cols, 0, 0]);
    seg([0, 0, 0], [0, DEPTH, 0]);
    seg([0, 0, 0], [0, 0, FRAME_H]);
    ctx.stroke();

    // store tray
    if (this.showStore > 0.01) {
      ctx.globalAlpha = this.showStore;
      const s = STORE;
      poly([[s.x, s.y, 0], [s.x + s.w, s.y, 0], [s.x + s.w, s.y + s.d, 0], [s.x, s.y + s.d, 0]]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.fill();
      ctx.strokeStyle = line;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      for (const [x, y] of [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.d], [s.x, s.y + s.d]]) this.handle(X(x, y), Y(x, y));
      this.label('STORE', X(s.x, s.y + s.d) - 8, Y(s.x, s.y + s.d) + 20, 'right');
      ctx.globalAlpha = 1;
    }

    // hover: find the tile under the pointer
    let hover: Ent | null = null;
    if (this.pointer) {
      const px = (this.pointer.x - ox) / u;
      const py = (this.pointer.y - oy) / u;
      let best = 0.5;
      for (const e of this.ents.values()) {
        if (e.state !== 'live' || e.a < 0.5) continue;
        const z = e.z + TILE_H;
        const wx = (px / C + (py + z) / S) / 2;
        const wy = ((py + z) / S - px / C) / 2;
        const d = Math.max(Math.abs(wx - e.x), Math.abs(wy - e.y));
        if (d < best) {
          best = d;
          hover = e;
        }
      }
    }
    const hm = hover ? hover.msg : null;
    if (hm !== this.hoverMsg || hover) {
      this.hoverMsg = hm;
      const m = hover && this.convo ? [...this.convo.msgs, ...(this.convo.summary ? [this.convo.summary] : [])].find((x) => x.id === hover!.msg) : null;
      this.onHover?.(m && hover ? { msg: m, tok: hover.tok, x: X(hover.x, hover.y, hover.z + TILE_H), y: Y(hover.x, hover.y, hover.z + TILE_H) } : null);
    }

    // tiles, far to near
    const list = [...this.ents.values()].filter((e) => e.delay <= 0 && e.a > 0.01);
    list.sort((a, b) => a.x + a.y + a.z * 0.01 - (b.x + b.y + b.z * 0.01));
    const scan = this.scanAt;
    const sx = scan ? ease(Math.min(1, (this.time - scan.t0) / scan.dur)) * (scan.to + 1.5) - 1 : -99;
    const h = TILE / 2;
    for (const e of list) {
      const pal = (e.stored ? PAL_DIM : PAL)[e.tone];
      let lift = this.reduce || e.stored ? 0 : Math.sin(this.time * 1.5 - e.x * 0.42 - e.y * 0.2) * 0.034;
      if (scan && !e.stored) {
        const d = (e.x - sx) / 1.25;
        lift += Math.exp(-d * d) * 0.5;
      }
      e.hot += ((hm === e.msg ? 1 : 0) - e.hot) * 0.25;
      lift += e.hot * 0.22;
      const z0 = e.z + lift;
      const z1 = z0 + TILE_H;
      const x0 = e.x - h;
      const x1 = e.x + h;
      const y0 = e.y - h;
      const y1 = e.y + h;
      ctx.globalAlpha = Math.max(0, Math.min(1, e.a));
      ctx.lineWidth = 1;
      ctx.strokeStyle = pal.line;
      poly([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]);
      ctx.closePath();
      ctx.fillStyle = pal.left;
      ctx.fill();
      ctx.stroke();
      poly([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]);
      ctx.closePath();
      ctx.fillStyle = pal.right;
      ctx.fill();
      ctx.stroke();
      poly([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]);
      ctx.closePath();
      ctx.fillStyle = pal.top;
      ctx.fill();
      ctx.stroke();
      if (e.tone === 'summary') {
        // a summary tile carries a small inset mark: it stands for several turns
        const q = h * 0.42;
        poly([[e.x - q, e.y - q, z1], [e.x + q, e.y - q, z1], [e.x + q, e.y + q, z1], [e.x - q, e.y + q, z1]]);
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // the reading sweep: a thin upright sheet moving along the window
    if (scan && sx > -0.5 && sx < scan.to + 0.6) {
      const g = ctx.createLinearGradient(X(sx, 0, 0), Y(sx, 0, 0), X(sx, 0, FRAME_H), Y(sx, 0, FRAME_H));
      g.addColorStop(0, 'rgba(245,165,36,0.30)');
      g.addColorStop(1, 'rgba(245,165,36,0.02)');
      poly([[sx, 0, 0], [sx, DEPTH, 0], [sx, DEPTH, FRAME_H], [sx, 0, FRAME_H]]);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(245,165,36,0.85)';
      ctx.beginPath();
      seg([sx, 0, 0.02], [sx, DEPTH, 0.02]);
      ctx.stroke();
    }

    // front edges of the frame, then its square handles
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    seg([cols, 0, 0], [cols, DEPTH, 0]);
    seg([0, DEPTH, 0], [cols, DEPTH, 0]);
    seg([cols, 0, 0], [cols, 0, FRAME_H]);
    seg([cols, DEPTH, 0], [cols, DEPTH, FRAME_H]);
    seg([0, DEPTH, 0], [0, DEPTH, FRAME_H]);
    seg([0, 0, FRAME_H], [cols, 0, FRAME_H]);
    seg([cols, 0, FRAME_H], [cols, DEPTH, FRAME_H]);
    seg([cols, DEPTH, FRAME_H], [0, DEPTH, FRAME_H]);
    seg([0, DEPTH, FRAME_H], [0, 0, FRAME_H]);
    ctx.stroke();
    for (const x of [0, cols]) for (const y of [0, DEPTH]) for (const z of [0, FRAME_H]) this.handle(X(x, y, z), Y(x, y, z));
    this.label('CONTEXT WINDOW', X(0, DEPTH, FRAME_H) - 10, Y(0, DEPTH, FRAME_H) - 10, 'right');

    // the owl, perched on the far top corner, watching what it is given
    const perch: [number, number, number] = [cols, 0, FRAME_H];
    const size = Math.max(44, u * 3);
    const gazeX = scan ? Math.max(0, Math.min(sx, scan.to)) : Math.max(0.5, used / DEPTH - 0.5);
    this.owl(X(...perch), Y(...perch) + 1, size, X(gazeX, DEPTH / 2, 0.4), Y(gazeX, DEPTH / 2, 0.4));

    this.onFrame?.();
  }

  private label(text: string, x: number, y: number, align: CanvasTextAlign) {
    const { ctx } = this;
    if (this.W < 620) return;
    ctx.font = '700 10.5px Geist, ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = align;
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(239,239,239,0.55)';
    try {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = '0.2px';
    } catch {}
    ctx.fillText(text, Math.round(x), Math.round(y));
  }

  private handle(x: number, y: number) {
    const { ctx } = this;
    ctx.fillStyle = '#232323';
    ctx.strokeStyle = 'rgba(239,239,239,0.8)';
    ctx.lineWidth = 1;
    ctx.fillRect(Math.round(x) - 2.5, Math.round(y) - 2.5, 5, 5);
    ctx.strokeRect(Math.round(x) - 2.5, Math.round(y) - 2.5, 5, 5);
  }

  /** The Ergon owl (same drawing as the logo), feet at (fx, fy), looking towards (gx, gy). */
  private owl(fx: number, fy: number, size: number, gx: number, gy: number) {
    const { ctx } = this;
    const k = size / 80;
    ctx.save();
    ctx.translate(fx - 32 * k, fy - 77 * k);
    ctx.scale(k, k);
    const ell = (cx: number, cy: number, rx: number, ry: number, fill: string) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
    };
    const dk = '#9c9c9c';
    ctx.fillStyle = dk;
    ctx.fill(OWL.earL);
    ctx.fill(OWL.earR);
    ell(32, 52, 21, 24, '#b5b5b5');
    ell(32, 28, 22, 19, '#c8c8c8');
    ctx.fillStyle = dk;
    ctx.fill(OWL.wingL);
    ctx.fill(OWL.wingR);
    ell(32, 57, 13, 16, '#f4f4f4');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#b5b5b5';
    ctx.lineWidth = 1.3;
    ctx.stroke(OWL.chev);
    ell(22.5, 28, 9, 9, '#ffffff');
    ell(41.5, 28, 9, 9, '#ffffff');
    // pupils follow the gaze point
    const hx = fx - 0 * k;
    const hy = fy - 49 * k;
    const ang = Math.atan2(gy - hy, gx - hx);
    const px = Math.cos(ang) * 2.6;
    const py = Math.sin(ang) * 2.2;
    for (const cx of [22.5, 41.5]) {
      ell(cx + px, 28 + py, 5.6, 5.6, '#f5a524');
      ell(cx + px, 28 + py, 2.9, 2.9, '#141414');
      ell(cx + px + 1.3, 28 + py - 1.4, 1.1, 1.1, '#ffffff');
    }
    // blink on the scene clock
    const bt = (this.time + 1.1) % 4.6;
    const lid = bt < 0.16 ? Math.sin((bt / 0.16) * Math.PI) : 0;
    if (lid > 0.02) {
      for (const cx of [22.5, 41.5]) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx - 10, 18, 20, 20 * lid);
        ctx.clip();
        ell(cx, 28, 9.4, 9.4, '#c8c8c8');
        ctx.restore();
      }
    }
    ctx.strokeStyle = '#5e5e5e';
    ctx.lineWidth = 2.2;
    ctx.stroke(OWL.brow);
    ctx.fillStyle = '#232323';
    ctx.fill(OWL.beak);
    ctx.strokeStyle = '#8a8a8a';
    ctx.lineWidth = 1.8;
    ctx.stroke(OWL.feet);
    ctx.restore();
  }

  /** css px of the owl's head, for the speech bubble */
  owlHead(): [number, number] {
    const [x, y] = this.project(this.cols, 0, FRAME_H);
    const size = Math.max(44, this.cam.z * 3);
    return [x, y - size];
  }
  /** css px of the middle of a message's tiles (null when it is not in the scene) */
  msgAnchor(id: string): [number, number] | null {
    let n = 0;
    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (const e of this.ents.values()) {
      if (e.msg !== id || e.state !== 'live' || e.delay > 0) continue;
      sx += e.x;
      sy += e.y;
      sz += e.z;
      n++;
    }
    return n ? this.project(sx / n, sy / n, sz / n + TILE_H) : null;
  }
  /** css px of the fact tiles (the amber ones), wherever they are */
  factAnchor(): [number, number] | null {
    let n = 0;
    let sx = 0;
    let sy = 0;
    let sz = 0;
    for (const e of this.ents.values()) {
      if (e.tone !== 'fact' || e.state !== 'live' || e.delay > 0) continue;
      sx += e.x;
      sy += e.y;
      sz += e.z;
      n++;
    }
    return n ? this.project(sx / n, sy / n, sz / n + TILE_H) : null;
  }
}

/** where the store tray sits: in front of the window's old end */
export const STORE = { x: 0.5, y: DEPTH + 3.2, w: 6.3, d: 4.6, nx: 7, ny: 5 };

function iso(x: number, y: number, z = 0): [number, number] {
  return [(x - y) * C, (x + y) * S - z];
}
function ease(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
