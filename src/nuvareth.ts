// Content for the Ergon Labs site (the live homepage, /founders, and the archived /archive/v/10-15 versions).
// Shares the detailed lists with site.ts, minus anything game-focused, with the wording kept professional.
import { site, services as allServices, engagements, aiPoints } from './site';

export const brand = {
  name: 'Ergon Labs',
  headline: 'Engineering the Next Era of Intelligence',
  intro:
    'Ergon Labs is an AI engineering firm. Lead engineers and AI researchers with experience across US and European companies, building agents, custom models and the systems around them.',
  email: site.email,
  location: site.location,
  bookingUrl: site.bookingUrl,
  socials: site.socials,
};

// professional rewording for the few service blurbs that were written casually
const blurbs: Record<string, string> = {
  cloud: 'Infrastructure defined as code, with automated, repeatable deployments and clear visibility into cost.',
  backend: 'Reliable, secure services and integrations that the rest of your product can depend on.',
  rescue: 'Modernising legacy systems, stabilising fast-built products, and taking over projects that need senior hands.',
  special: 'Specialised builds beyond the categories above, scoped with the same engineering standards.',
};
export const services = allServices
  .filter((s) => s.id !== 'games')
  .map((s) => (blurbs[s.id] ? { ...s, blurb: blurbs[s.id] } : s));

// the homepage's six services: the detailed site.ts list grouped so nothing
// overlaps. `id` picks the IsoScene drawing.
export const homeServices = [
  {
    id: 'ai',
    title: 'AI and agents',
    blurb:
      'Agents, assistants and LLM features that do a real job inside your product or operations, from first prototype to monitored production. Each one is tested against your real cases before anyone relies on it.',
    items: ['Agents', 'RAG', 'Voice AI', 'Assistants', 'Automation', 'Evals', 'MCP'],
  },
  {
    id: 'ml',
    title: 'Custom models and data',
    blurb:
      'When an off-the-shelf model is not good enough, we train, fine-tune and serve one that is, and build the data pipelines underneath it, because most AI projects are data projects first.',
    items: ['Fine-tuning', 'PyTorch', 'Vision', 'Forecasting', 'Pipelines', 'Vector DBs', 'MLOps'],
  },
  {
    id: 'design',
    title: 'Product UI/UX',
    blurb:
      'Research, flows and pixel-perfect designs for web, mobile and AI products, including interfaces people can trust when a model is in the loop. Simple for your users, and straightforward for engineers to build.',
    items: ['Figma', 'Research', 'Web apps', 'Mobile apps', 'Design systems', 'Dashboards'],
  },
  {
    id: 'web',
    title: 'Full-stack product engineering',
    blurb:
      'From design to production: web apps, mobile apps, backends and APIs, built by senior engineers with tests from the first release. Websites and landing pages too, when your product needs them.',
    items: ['Next.js', 'TypeScript', 'React Native', 'Node.js', 'Python', 'PostgreSQL'],
  },
  {
    id: 'cloud',
    title: 'Cloud, DevOps and security',
    blurb:
      'Infrastructure defined as code, automated deployments, monitoring and security reviews, so releases are routine and costs stay visible.',
    items: ['AWS', 'GCP', 'Azure', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD'],
  },
  {
    id: 'rescue',
    title: 'Rescue, audits and advice',
    blurb:
      'Stabilising fast-built products and legacy systems, independent code and architecture audits, and a senior engineer at the table when a decision is expensive. It can start with a free audit.',
    items: ['Code audits', 'Architecture', 'Modernisation', 'Performance', 'Fractional CTO'],
  },
];

export const facts = [
  { k: 'US & Europe', v: 'engineering experience behind every project' },
  { k: 'Lead-level', v: 'engineers and researchers, start to finish' },
  { k: 'Weekly', v: 'demos, on a link you can open' },
  { k: 'Yours', v: 'code, cloud and IP from the first commit' },
];

export const nvNav = [
  { label: 'Services', href: '#services' },
  { label: 'AI in production', href: '#ai' },
  { label: 'Process', href: '#process' },
  { label: 'Engagements', href: '#engagements' },
  { label: 'FAQ', href: '#faq' },
];

export const principles = [
  {
    title: 'Senior engineers, start to finish',
    text: 'The people you meet on the first call are the people who design, build and ship your system.',
  },
  {
    title: 'Quality is built in from day one',
    text: 'Automated tests, evaluation suites and monitoring are part of the first release, so every change is measured.',
  },
  {
    title: 'The right solution for the problem',
    text: 'We recommend AI where it creates measurable value, and proven conventional engineering where that serves you better.',
  },
  {
    title: 'Full ownership from the first commit',
    text: 'Your repositories, your cloud accounts, your keys and your intellectual property. Everything we build is yours.',
  },
  {
    title: 'Clear, regular reporting',
    text: 'A written update every week on progress, next steps and spend, so you always know exactly where things stand.',
  },
];

export const faqs = [
  {
    q: 'Who would we be working with?',
    a: 'Our founders and senior engineers directly. Between them they bring lead engineering experience across US and European companies and published AI research.',
  },
  {
    q: 'How soon can you start?',
    a: 'Usually within one to two weeks of agreeing on scope. The scoping phase itself can begin sooner.',
  },
  {
    q: 'What does it cost?',
    a: 'Sprints and audits have a fixed price that you see before any work starts. Longer builds and embedded engineers are billed monthly at a rate agreed up front, and you can stop at the end of any month.',
  },
  {
    q: 'We already have developers. Does that work?',
    a: 'Yes. We regularly work alongside in-house teams: owning a specialised piece such as the AI layer, adding senior capacity for a period, or reviewing an architecture before it is built.',
  },
  {
    q: 'How do you decide whether AI is the right fit?',
    a: 'We test the idea on your real data first and share the results, including where conventional software would be more cost-effective or reliable.',
  },
  {
    q: 'Who owns the code and the data?',
    a: 'You do. We work in your repositories and cloud accounts, and the contract assigns all IP to you. Your data is never used to train anything without your written consent.',
  },
  {
    q: 'Can you take over or improve an existing product?',
    a: 'Yes. We review the codebase, keep what is sound and strengthen what needs to scale, usually without a full rewrite.',
  },
  {
    q: 'What happens after launch?',
    a: 'Your choice: a support agreement with defined response times, continued product development, or a structured handover to your own team.',
  },
];

export const founders = [
  {
    id: 'rizwan',
    name: 'Muhammad Rizwan',
    role: 'Co-founder · Engineering',
    photo: '/founders/rizwan.webp',
    alt: 'Portrait of Muhammad Rizwan',
    lead:
      'A lead engineer with more than six years of experience building production software for companies in the United States and Europe.',
    bio: [
      'Rizwan has led distributed engineering teams as a technical team lead, setting quality standards and guiding architecture on products for clients including Sourcegraph, Appsmith, Parabol and Immunefi.',
      'He has built embedded, white-label payroll and workforce platforms used by businesses across the US, from complex scheduling systems and shared SDKs to payments and platform APIs. Alongside full-stack product engineering, he builds and deploys machine learning systems, from deep learning models on AWS SageMaker to retrieval and agentic AI.',
      'At Ergon Labs he leads architecture and delivery, making sure every system is built to run reliably in production.',
    ],
    highlights: ['Technical team lead', '6+ years in production', 'Full-stack & platform architecture', 'Applied ML on AWS'],
    stack: ['TypeScript', 'React', 'Node.js', 'C# / .NET', 'PostgreSQL', 'PyTorch', 'RAG & agents'],
    links: [
      { label: 'LinkedIn', href: 'https://www.linkedin.com/in/muhammad-rizwan-j/' },
      { label: 'Portfolio', href: 'https://mrizzy.vercel.app' },
    ],
  },
  {
    id: 'talha',
    name: 'Talha Asif',
    role: 'Co-founder · AI Research',
    photo: '/founders/talha.webp',
    alt: 'Portrait of Talha Asif',
    lead:
      'An AI researcher and lead engineer working on LLM agents, reinforcement learning and trustworthy AI, with published research and industry experience in the US and Europe.',
    bio: [
      'Talha has carried out AI research with the University of Illinois Urbana-Champaign, building fault-injection benchmarks for SREGym, an agent benchmark accepted at NeurIPS 2026, and with the Norwegian University of Science and Technology on reinforcement learning for multilingual fact verification.',
      'He is an author of research papers on prompt-injection security for AI agents, test-time reasoning, and energy-efficient, well-calibrated NLP. In industry he built an LLM evaluation platform serving more than 2,000 users for a New York AI company, and he was selected for Google Summer of Code 2026 to build AI moderation for Drupal.',
      'At Ergon Labs he leads AI research and evaluation, bringing research-grade rigour to every model we put into production.',
    ],
    highlights: ['Published AI researcher', 'NeurIPS 2026 benchmark work', 'Google Summer of Code 2026', 'LLM evaluation at scale'],
    stack: ['LLM agents', 'Reinforcement learning', 'PyTorch', 'LangGraph', 'MCP', 'Evaluation & safety'],
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com/in/talha-asif7' },
      { label: 'Portfolio', href: 'https://talha-asif-dev.vercel.app' },
    ],
  },
];

export const values = [
  {
    title: 'Engineering rigour',
    text: 'We treat AI as engineering, not experimentation. Every system ships with tests, evaluations and monitoring, and every claim is backed by measurement.',
  },
  {
    title: 'Responsible AI',
    text: 'Human oversight where it matters, clear limits on what a system may do, and safeguards against misuse are designed in from the start.',
  },
  {
    title: 'Transparency',
    text: 'Clear scopes, fixed prices where possible, and plain-language reporting. You always know what is being built, why, and what it costs.',
  },
  {
    title: 'Security and privacy by design',
    text: 'Least-privilege access, data kept in your environment, and nothing used for training without written consent.',
  },
  {
    title: 'Research-informed',
    text: 'We follow the research closely and contribute to it, so our clients benefit from methods that are proven, not just popular.',
  },
  {
    title: 'Long-term partnership',
    text: 'We build systems your team can own and extend, with documentation and handover that outlast the engagement.',
  },
];

export const process = [
  {
    title: 'Scope',
    time: 'First week',
    text: 'We learn your goals, review what exists and define the smallest version worth shipping. You receive a scope, a price and a date on two pages.',
  },
  {
    title: 'Prove',
    time: 'Week two',
    text: 'A thin working slice on real infrastructure. For AI work, this is where we validate that the model performs on your data before the full build.',
  },
  {
    title: 'Build',
    time: 'Weekly',
    text: 'A demo every week on a link you can open. Code is reviewed and tested as it lands, so progress is always visible and verifiable.',
  },
  {
    title: 'Run',
    time: 'After launch',
    text: 'We launch, monitor and support the system in production. Then we continue with you, or hand over with documentation your team can rely on.',
  },
];

export { engagements, aiPoints };
