// Client testimonials for the homepage.
//
// PLACEHOLDER CONTENT for the design phase: every name, company, quote and photo below is invented or a stand-in
// so the section can be designed and reviewed. While `testimonialsArePlaceholders` is true the section shows a
// visible "placeholder" notice. Before the site is used for business, replace every entry with a real, approved
// testimonial (with the client's permission to use their name, title and photo) and set the flag to false.
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
      'We came in wanting a chatbot. They talked us out of half of it and built the part that actually mattered. Months later it still handles most of our support tickets on its own.',
    name: 'Alex Morgan',
    role: 'Head of Product',
    company: 'Northstar',
    photo: '/clients/alex-morgan.webp',
  },
  {
    quote:
      'What I liked most was the weekly demo. No status decks, just a link that worked. By week two we were testing it on our own data.',
    name: 'Jordan Lee',
    role: 'CTO',
    company: 'Forma',
    photo: '/clients/jordan-lee.webp',
  },
  {
    quote:
      'Honestly, the handover was the best part. Clear docs, clean code, and our two engineers took it over without ever needing to call them back.',
    name: 'Sam Taylor',
    role: 'Founder',
    company: 'Orbit',
    photo: '/clients/sam-taylor.webp',
  },
  {
    quote:
      'They tested everything on our real invoices before it went anywhere near production, so the launch was boring in the best possible way.',
    name: 'Nadia Haddad',
    role: 'Operations Lead',
    company: 'Halden',
    photo: '/clients/nadia-haddad.webp',
  },
  {
    quote: "The people on the first call were the people who wrote the code. That doesn't happen often, and it showed.",
    name: 'Marco Bianchi',
    role: 'VP Engineering',
    company: 'Lumen Freight',
    photo: '/clients/marco-bianchi.webp',
  },
  {
    quote:
      "Straight answers about what AI could and couldn't do for us, and a fixed price before we started. We'll be working with them again.",
    name: 'Hannah Okafor',
    role: 'Director of Data',
    company: 'Cedar Health',
    photo: '/clients/hannah-okafor.webp',
  },
];
