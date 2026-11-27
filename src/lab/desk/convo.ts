// The conversation model behind "The context window" piece. No drawing here: this file decides which messages
// are sent to the model on each turn (the "window") and what happens to the ones that no longer fit.
// It models what the app around a model does. No language model runs on the page.

export type Role = 'system' | 'user' | 'ai' | 'summary';
export type Where = 'window' | 'gone' | 'store' | 'folded';

export interface Msg {
  id: string;
  role: Role;
  text: string;
  toks: string[];
  /** token index range [from, to) of the fact the story follows */
  fact?: [number, number];
  pinned?: boolean;
  retrieved?: boolean;
  where: Where;
}

export interface Mode {
  /** keep an extracted note at the start of the window, always */
  pin: boolean;
  /** fold old turns into a short summary */
  sum: boolean;
  /** move old turns to a store and search it on each question */
  store: boolean;
}

/** Approximate tokeniser: words, word pieces for long words, numbers and punctuation. Real tokenisers differ
    in detail; in English they average about four characters per token, and so does this. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  const re = /\s*(?:[A-Za-zÀ-ÿ]+|'[a-z]+|\d+|[^\sA-Za-z\d])/g;
  for (const m of text.match(re) ?? []) {
    const lead = m.match(/^\s*/)![0];
    const w = m.slice(lead.length);
    if (/^[A-Za-zÀ-ÿ]/.test(w) && w.length > 8) {
      const cut = Math.ceil(w.length / 2);
      out.push(lead + w.slice(0, cut), w.slice(cut));
    } else out.push(m);
  }
  return out;
}

function factRange(toks: string[], fact: string): [number, number] | undefined {
  const want = tokenize(fact).map((t) => t.trim().toLowerCase());
  const have = toks.map((t) => t.trim().toLowerCase());
  for (let i = 0; i + want.length <= have.length; i++) {
    if (want.every((w, k) => have[i + k] === w)) return [i, i + want.length];
  }
  return undefined;
}

const FOOD = /\b(dinner|lunch|breakfast|eat|eating|food|restaurant|cook|meal|snack|book a table|allerg)/i;

export class Convo {
  cap: number;
  mode: Mode;
  msgs: Msg[] = [];
  summary: Msg | null = null;
  private n = 0;
  private foldedToks = 0;

  constructor(cap: number, mode: Partial<Mode> = {}) {
    this.cap = cap;
    this.mode = { pin: false, sum: false, store: false, ...mode };
  }

  add(role: Role, text: string, opts: { fact?: string; pinned?: boolean; id?: string } = {}): Msg {
    const toks = tokenize(text);
    const m: Msg = {
      id: opts.id ?? `m${this.n}`,
      role,
      text,
      toks,
      fact: opts.fact ? factRange(toks, opts.fact) : undefined,
      pinned: opts.pinned,
      where: 'window',
    };
    this.n++;
    this.msgs.push(m);
    this.trim();
    return m;
  }

  /** What is sent to the model, in order: pinned notes, the summary, then the turns that still fit. */
  window(): Msg[] {
    const live = this.msgs.filter((m) => m.where === 'window');
    const pinned = live.filter((m) => m.pinned);
    const rest = live.filter((m) => !m.pinned && !m.retrieved);
    const back = live.filter((m) => m.retrieved);
    // turns fetched back from the store go in just before the question that fetched them
    let at = rest.length;
    for (let i = rest.length - 1; i >= 0; i--) {
      if (rest[i].role === 'user') {
        at = i;
        break;
      }
    }
    if (back.length) rest.splice(at, 0, ...back);
    return [...pinned, ...(this.summary ? [this.summary] : []), ...rest];
  }

  used(): number {
    return this.window().reduce((n, m) => n + m.toks.length, 0);
  }

  stored(): Msg[] {
    return this.msgs.filter((m) => m.where === 'store');
  }

  /** Does the model receive the fact on the next call? */
  factVisible(): boolean {
    return this.window().some((m) => m.fact);
  }

  /** Drop, fold or store the oldest turns until the rest fits. */
  trim() {
    const over = () => this.used() > this.cap;
    if (!over()) return;
    // a summary is made in batches: fold until there is real room again
    const goal = this.mode.sum ? Math.floor(this.cap * 0.72) : this.cap;
    let guard = 200;
    while (this.used() > goal && guard--) {
      // never the newest message, and not a turn that was just fetched back from the store
      const live = this.msgs.filter((m) => m.where === 'window' && !m.pinned);
      const newest = live[live.length - 1];
      const victim = live.find((m) => m !== newest && !m.retrieved);
      if (!victim) break;
      if (this.mode.sum) this.fold(victim);
      else victim.where = this.mode.store ? 'store' : 'gone';
      if (!this.mode.sum && !over()) break;
    }
  }

  private fold(m: Msg) {
    m.where = 'folded';
    this.foldedToks += m.toks.length;
    const hasFact = !!m.fact || !!this.summary?.fact;
    const size = Math.max(6, Math.round(this.foldedToks * 0.2));
    const lead = hasFact ? ['Allergic', ' to', ' peanuts', '.'] : [];
    const body = ['Trip', ':', ' Lisbon', ',', ' June', ' 3', ' to', ' 10', ',', ' two', ' people', '.', ' Hotel', ' held', ' in', ' Alfama', '.', ' Sintra', ' on', ' the', ' 6', 'th', '.'];
    const toks = [...lead, ...body].slice(0, Math.max(size, lead.length + 4));
    while (toks.length < size) toks.push(' …');
    this.summary = {
      id: 'sum',
      role: 'summary',
      text: toks.join('').trim(),
      toks,
      fact: hasFact ? [0, 3] : undefined,
      where: 'window',
    };
  }

  /** Search the store for turns related to the question and put the best matches back in the window.
      A real system does this with embeddings; here a food question matches the allergy turn, and any other
      question matches on shared words. */
  retrieveFor(question: string): Msg[] {
    const words = new Set(
      tokenize(question)
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 3),
    );
    const scored = this.stored()
      .map((m) => {
        let s = 0;
        for (const t of m.toks) if (words.has(t.trim().toLowerCase())) s++;
        if (m.fact && FOOD.test(question)) s += 5;
        return { m, s };
      })
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 2);
    for (const { m } of scored) {
      m.where = 'window';
      m.retrieved = true;
    }
    this.trim();
    return scored.map((x) => x.m);
  }

  /** The reply the travel assistant gives. It is scripted: it depends only on whether the fact was sent. */
  reply(question: string): string {
    if (/allerg/i.test(question)) {
      return this.factVisible() ? 'Peanuts. You told me at the start.' : 'You have not mentioned any allergies.';
    }
    if (FOOD.test(question)) {
      return this.factVisible()
        ? 'Booked Horta at 8, a vegetable kitchen in Alfama. I told them about the peanut allergy.'
        : 'Booked Bangkok Garden at 8. Their peanut satay is the thing to order.';
    }
    const filler = [
      'Done. Anything else for the trip?',
      'The 28 tram stops two streets from the hotel and runs until 11 at night.',
      'Added. I also put the hotel address in your notes so the taxi driver can read it.',
      'June is dry in Lisbon, around 25 degrees by day. Pack a light jacket for the evenings by the river.',
    ];
    return filler[this.msgs.length % filler.length];
  }
}

// ---------------------------------------------------------------------------------------------------------
// The story the page tells: one trip-planning chat, the same in every version.

export const CAP = 108;

const SYS = 'You are a travel assistant for Ergon Trips. Keep answers short.';
const NOTE = 'Keep in mind: allergic to peanuts.';
const TURNS: [Role, string, string?][] = [
  ['user', "Hi! We're planning a week in Lisbon. One thing first: I'm allergic to peanuts.", 'allergic to peanuts'],
  ['ai', 'Noted, no peanuts. When do you fly?'],
  ['user', 'June 3 to June 10, two of us.'],
  ['ai', 'Got it. A hotel near the river, or up in Alfama?'],
  ['user', 'Alfama. Somewhere quiet, under 150 euros a night.'],
  ['ai', 'Casa do Limoeiro has a double at 138 euros on a quiet street, breakfast included. Shall I hold it?'],
  ['user', 'Yes. And a day trip to Sintra on the 6th?'],
  ['ai', 'Held. For Sintra, the 9:10 train from Rossio takes 40 minutes. I can add Pena Palace tickets for 10:30.'],
  ['user', 'Add them. Can you book dinner for our last night?'],
];
export const QUESTION = TURNS[8][1];

/** Build the chat up to and including turn `upto` (0-based index into TURNS; -1 = system prompt only;
    9 = the assistant's final reply). */
export function story(upto: number, mode: Partial<Mode> = {}): { c: Convo; answer?: string; pulled: Msg[] } {
  const c = new Convo(CAP, mode);
  let pulled: Msg[] = [];
  let answer: string | undefined;
  if (upto < -1) return { c, pulled };
  c.add('system', SYS, { pinned: true, id: 'sys' });
  for (let i = 0; i <= Math.min(upto, TURNS.length - 1); i++) {
    const [role, text, fact] = TURNS[i];
    c.add(role, text, { fact, id: `t${i}` });
    if (i === 0 && c.mode.pin) c.add('system', NOTE, { pinned: true, fact: 'allergic to peanuts', id: 'note' });
    if (i === TURNS.length - 1 && c.mode.store) pulled = c.retrieveFor(text);
  }
  if (upto >= TURNS.length) {
    answer = c.reply(QUESTION);
    c.add('ai', answer, { id: 'ans' });
  }
  return { c, answer, pulled };
}
