// Client testimonials for the homepage.
//
// PLACEHOLDER CONTENT: every name, company and quote below is invented so the section can be designed and
// reviewed. Do not ship this to production. Replace each entry with a real, approved quote from a real client
// (and their permission to use their name, title and photo) before merging to main.
//
// `photo` is optional: put a square headshot in public/clients/ and set e.g. photo: '/clients/jane.webp'.
// Without one, the card shows the client's initials.

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
  photo?: string;
};

export const testimonialsArePlaceholders = true;

export const testimonials: Testimonial[] = [
  {
    quote:
      'They tested the agent against six months of our real support tickets before it answered a single customer. When it went live we already knew its pass rate, and it has held up since.',
    name: 'Sample Client A',
    role: 'Head of Operations',
    company: 'Placeholder Co.',
  },
  {
    quote:
      'We expected a pitch for a big AI build. Instead they showed us that half of it was a few hundred lines of ordinary code, and built the part that actually needed a model.',
    name: 'Sample Client B',
    role: 'CTO',
    company: 'Example Logistics',
  },
  {
    quote:
      'Weekly demos on a link we could click meant we never had to ask where things stood. The handover docs were good enough that our own team took it over in a week.',
    name: 'Sample Client C',
    role: 'Founder',
    company: 'Demo Health',
  },
  {
    quote:
      'Senior people from the first call to launch. The engineers in the scoping meeting were the ones writing the code, and it showed in how few surprises we had.',
    name: 'Sample Client D',
    role: 'VP Engineering',
    company: 'Test Fintech',
  },
];
