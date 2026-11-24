// Everything brand- or content-specific lives here. Change it once, the whole site follows.

export const site = {
  name: 'Destiny Valley',
  tagline: 'Software and AI engineering',
  description:
    'A small studio of senior engineers. More than ten years of production software and AI, from people who have worked at leading companies since 2018 across the whole development cycle.',
  email: 'hello@example.com', // TODO: replace with the real inbox
  bookingUrl: '', // optional: Cal.com / Calendly link. When set, the main buttons point to it.
  location: 'Prague',
  socials: [
    { label: 'LinkedIn', href: '#' },
    { label: 'X', href: '#' }, // TODO: company X (Twitter) profile URL
  ],
};

export const nav = [
  { label: 'Services', href: '#services' },
  { label: 'AI work', href: '#ai' },
  { label: 'How it goes', href: '#process' },
  { label: 'Working together', href: '#engagements' },
  { label: 'Questions', href: '#faq' },
];

export type Service = {
  id: string;
  title: string;
  blurb: string;
  items: string[];
  note?: string;
};

export const services: Service[] = [
  {
    id: 'ai',
    title: 'AI and agents',
    note: 'What most people call us about',
    blurb:
      'Getting a model to do a real job inside your product or your back office, then proving it does that job before anyone relies on it.',
    items: [
      'Custom agents',
      'Multi-agent systems (CrewAI, LangGraph)',
      'LLM features in existing products',
      'Search over your own documents (RAG)',
      'Voice agents and phone lines',
      'In-app assistants',
      'Document and invoice extraction',
      'Evals, guardrails, monitoring',
      'MCP servers and tool integrations',
      'A straight answer on whether AI fits',
    ],
  },
  {
    id: 'ml',
    title: 'Machine learning and custom models',
    blurb: 'When an off-the-shelf model is not good enough, our ML and deep learning engineers train one that is.',
    items: [
      'Custom model training',
      'Fine-tuning open-weight LLMs',
      'Deep learning in PyTorch',
      'Computer vision',
      'Speech and NLP',
      'Forecasting and recommendations',
      'Classic ML on tabular data',
      'Model serving and MLOps',
    ],
  },
  {
    id: 'automation',
    title: 'Workflow automation',
    blurb: 'The copy-paste work between your tools, handed to software. No-code where it is enough, real code where it is not.',
    items: [
      'Zapier, Make and n8n builds',
      'Self-hosted n8n',
      'Back-office automation',
      'CRM and inbox workflows',
      'Custom connectors and webhooks',
      'Moving fragile zaps to real code',
    ],
  },
  {
    id: 'web',
    title: 'Web development',
    blurb: 'Sites and web apps that load fast, work on a bad connection and can be found.',
    items: [
      'Web applications',
      'SaaS platforms',
      'Marketing and content sites',
      'Online shops and checkout',
      'Dashboards and admin panels',
      'Customer portals',
      'Progressive web apps',
      'Headless CMS',
    ],
  },
  {
    id: 'mobile',
    title: 'App development',
    blurb: 'iPhone and Android apps, native when it matters and cross-platform when it does not.',
    items: [
      'iOS in Swift',
      'Android in Kotlin',
      'React Native and Flutter',
      'Offline mode and sync',
      'Push, payments, subscriptions',
      'App Store and Play submission',
    ],
  },
  {
    id: 'games',
    title: 'Game development',
    blurb: 'Games from first prototype to live operations, in whichever engine suits the game.',
    items: [
      'Unity',
      'Unreal Engine',
      'Godot',
      'Roblox experiences',
      'Game and level design',
      'Multiplayer and netcode',
      'Mobile and console ports',
      'Monetisation and live ops',
    ],
  },
  {
    id: 'backend',
    title: 'Backend and APIs',
    blurb: 'The part nobody sees until it breaks. We would rather it did not.',
    items: [
      'API design (REST, GraphQL, gRPC)',
      'Event-driven systems',
      'Real-time and streaming',
      'Payments and billing',
      'CRM, ERP and third-party integrations',
      'Login, SSO, permissions',
      'Database design and tuning',
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud and DevOps',
    blurb: 'Infrastructure written down as code, and deploys boring enough to do on a Friday.',
    items: [
      'AWS, Google Cloud, Azure',
      'Infrastructure as code',
      'CI/CD pipelines',
      'Containers and Kubernetes',
      'Monitoring and on-call setup',
      'Cutting the cloud bill',
    ],
  },
  {
    id: 'data',
    title: 'Data engineering',
    blurb: 'Most AI projects are data projects with a model on top. We do the bottom half too.',
    items: [
      'Pipelines and ETL',
      'Warehouses and lakehouses',
      'Reporting and BI',
      'Vector and search infrastructure',
      'Data quality checks',
    ],
  },
  {
    id: 'design',
    title: 'Product and design',
    blurb: 'Working out what to build, and what to leave out, before anyone writes code.',
    items: ['Discovery and scoping', 'UX flows', 'Interface design', 'Clickable prototypes', 'Design systems'],
  },
  {
    id: 'quality',
    title: 'Testing and security',
    blurb: 'Automated checks for the things people forget to check by hand.',
    items: [
      'Test automation',
      'Load and performance testing',
      'Security review and hardening',
      'Pen-test preparation',
      'GDPR and SOC 2 groundwork',
      'Accessibility audits',
    ],
  },
  {
    id: 'rescue',
    title: 'Rescue and modernisation',
    blurb: 'Old systems, half-finished projects, and apps an AI tool wrote that now have real users.',
    items: [
      'Legacy migrations',
      'Cleaning up AI-generated codebases',
      'Refactoring and re-architecture',
      'Fixing slow systems',
      'Framework and version upgrades',
      'Taking over stalled projects',
    ],
  },
  {
    id: 'advisory',
    title: 'Teams and advice',
    blurb: 'A senior engineer in the room when the decision is expensive.',
    items: [
      'Fractional CTO',
      'A dedicated product team',
      'Engineers embedded in your team',
      'Code and architecture audits',
      'Technical due diligence',
      'Support and maintenance',
    ],
  },
  {
    id: 'special',
    title: 'Everything else',
    blurb: 'The odd-shaped jobs. We like these.',
    items: [
      'Internal tools',
      'Browser extensions',
      'Desktop apps',
      'Slack, Teams and WhatsApp bots',
      'Fintech and payment flows',
      'IoT and device backends',
      'Real-time 3D on the web',
    ],
  },
];

export const aiPoints = [
  {
    title: 'It answers from your data',
    text: 'Retrieval with permissions and citations, so an answer can be traced to the document it came from.',
  },
  {
    title: 'It is tested like software',
    text: 'We build a test set from your real cases and run it on every change. You get a pass rate, not a feeling.',
  },
  {
    title: 'It knows when to stop',
    text: 'Routine cases go through. Uncertain ones go to a person, with the full trail attached.',
  },
  {
    title: 'It has a budget',
    text: 'Model routing, caching and fallbacks, so cost per task and response time are numbers you picked.',
  },
];

export const process = [
  {
    title: 'Scope',
    time: 'First week',
    text: 'We talk, read whatever exists, and write down the smallest version worth shipping. You get a scope, a price and a date on two pages.',
  },
  {
    title: 'Prove',
    time: 'Week two',
    text: 'A thin working slice on real infrastructure. For AI work, this is where we find out whether the model can do the job, before you pay for the rest.',
  },
  {
    title: 'Build',
    time: 'Weekly',
    text: 'A demo every week, on a link you can open. Code is reviewed and tested as it lands. No status meetings to learn what you could have clicked.',
  },
  {
    title: 'Run',
    time: 'After launch',
    text: 'We ship it, watch it and fix what breaks, day or night. Later we keep going with you, or hand over with documentation your team can use.',
  },
];

export const engagements = [
  {
    name: 'Sprint',
    for: 'A prototype, an MVP, an AI proof of concept',
    text: 'One problem, a fixed price and a date. Built properly enough that you can keep it.',
    points: ['Scope agreed before we start', 'Demo every week', 'You keep the code'],
  },
  {
    name: 'Build',
    for: 'A whole product',
    text: 'Design, engineering and AI from one team. We run delivery. You make the product calls.',
    points: ['One team, one invoice', 'Monthly plan, weekly demo', 'We stay through launch'],
    featured: true,
  },
  {
    name: 'Embed',
    for: 'A team that is short of senior people',
    text: 'Our engineers join your stand-ups, your repo and your on-call. Productive in the first week.',
    points: ['Senior engineers only', 'Month to month', 'Your process, your tools'],
  },
  {
    name: 'Advise',
    for: 'A decision you only get to make once',
    text: 'An audit, an architecture review or a few days a month of a CTO. Answers in writing.',
    points: ['Code and architecture audits', 'Where AI would pay off', 'Fractional CTO'],
  },
];

export const principles = [
  {
    title: 'The people you meet write the code',
    text: 'No account managers and no handover to a junior team after the contract is signed.',
  },
  {
    title: 'Tests and monitoring go in first',
    text: 'They are cheap on day one and expensive after the first outage. We have paid for that lesson already.',
  },
  {
    title: 'We will talk you out of AI',
    text: 'If forty lines of ordinary code do the job, we say so. It happens more often than you would think.',
  },
  {
    title: 'It is yours from the first commit',
    text: 'Your repository, your cloud account, your keys. If you fire us, nothing has to move.',
  },
  {
    title: 'Bad news on the day we know it',
    text: 'One written update a week: what shipped, what slipped, what it cost.',
  },
];

export const faqs = [
  {
    q: 'Who would we be working with?',
    a: 'Senior engineers and AI specialists with more than ten years in production software. We have worked at leading companies since 2018, across the whole development cycle: scoping, design, build, launch and the years of running it afterwards. The people on the first call are the people who write the code.',
  },
  {
    q: 'How soon can you start?',
    a: 'Usually a week or two after we agree on scope. The scoping week itself can start sooner.',
  },
  {
    q: 'What does it cost?',
    a: 'Sprints and audits have a fixed price that you see before any work starts. Longer builds and embedded engineers are billed monthly at a rate we agree up front, and you can stop at the end of any month.',
  },
  {
    q: 'We have developers already. Is that a problem?',
    a: 'No. We often work next to an in-house team: taking one hard piece such as the AI layer, adding senior capacity for a few months, or reviewing a design before it gets built.',
  },
  {
    q: 'Do we need AI for this at all?',
    a: 'Maybe not. We try the idea on your real data first and tell you what we found, including when plain software would be cheaper and more reliable.',
  },
  {
    q: 'Who owns the code?',
    a: 'You do. We work in your repositories and your cloud accounts, and the contract assigns the IP to you. Your data does not train anything unless you ask for that in writing.',
  },
  {
    q: 'Our app was built fast with AI tools and it is falling over. Can you fix it?',
    a: 'Probably. We read the code, keep what is sound and rebuild what will not survive real users. It is rarely a full rewrite.',
  },
  {
    q: 'What happens after launch?',
    a: 'Up to you. A support contract with agreed response times, more product work, or a handover to your own people with a few weeks of overlap.',
  },
];
