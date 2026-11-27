// Everything listed on /lab. Newest first. Add a piece here and it appears on the index.
export interface Piece {
  href: string;
  title: string;
  blurb: string;
  date: string; // ISO
  topic: string;
  kind: 'Interactive' | 'Article' | 'Study';
  minutes: number;
  image: string;
  alt: string;
}

export const pieces: Piece[] = [
  {
    href: '/lab/context-window',
    title: 'Why the AI forgot what you said',
    blurb: 'Watch one chat fill a context window, lose the message that mattered, and get it back three different ways. Then run it yourself.',
    date: '2026-11-28',
    topic: 'AI',
    kind: 'Interactive',
    minutes: 3,
    image: '/lab/context-window.png',
    alt: 'An isometric box filled with small tiles, one group of them amber, with an owl sitting on its corner',
  },
];

export const fmtDate = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
