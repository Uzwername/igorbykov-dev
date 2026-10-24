// Renders the CV as an HTML string from src/data/cv.json + scripts/cv/layout.ts.
// ghtml escapes every `${…}`; `!${…}` embeds already-rendered HTML (nested `html` calls).

import { html } from 'ghtml';
import type data from '../../src/data/cv.json';

type Cv = typeof data;
type Position = Cv['positions'][number];

export type BlockName = keyof typeof blocks;

export interface Layout {
  pages: {
    title?: boolean;
    sidebar: BlockName[];
    /** `{ positions: n }` takes the next n roles in src/data/cv.json order; roles left over are omitted */
    main: (BlockName | { positions: number })[];
    /** Closing pointer to LinkedIn for everything that didn't fit */
    footer?: boolean;
  }[];
}

// "2023-09" -> "09/2023", null -> "present"
const formatDate = (ym: string | null) => (ym ? ym.split('-').reverse().join('/') : 'present');
const urlPath = (url: string) => new URL(url).pathname;
const lastSegment = (url: string) => urlPath(url).split('/').filter(Boolean).at(-1);
const year = (ym: string) => ym.slice(0, 4);

const fail = (message: string): never => {
  throw new Error(`Layout error: ${message}`);
};

const list = (items: string[], { raw = false } = {}) =>
  html`<ul>!${items.map((item) => (raw ? html`<li>!${item}</li>` : html`<li>${item}</li>`))}</ul>`;

const pairs = (rows: [label: string, href: string, text: string][]) =>
  html`<dl>!${rows.map(([label, href, text]) => html`<dt>${label}</dt><dd><a href="${href}">${text}</a></dd>`)}</dl>`;

const section = (heading: string | null, body: string) =>
  html`<section>!${heading ? html`<h2>${heading}</h2>` : ''}!${body}</section>`;

const entry = (cv: Cv, { id, title, companyId, startDate, endDate, achievements }: Position) => {
  const company = cv.companies.find(({ id }) => id === companyId) ?? fail(`unknown company of "${id}"`);

  return section(
    [title, company.name, `${formatDate(startDate)} - ${formatDate(endDate)}`].join(' | '),
    achievements.length ? list(achievements) : '',
  );
};

const blocks = {
  contact: ({ profile: { contact: { email, phone, linkedin } } }: Cv) =>
    section('Contact Info', pairs([
      ['Email', `mailto:${email}`, email],
      ['Mobile', `tel:${phone.replaceAll(' ', '')}`, phone],
      ['LinkedIn', linkedin, `${urlPath(linkedin)}/`],
    ])),

  web: ({ profile: { contact: { website, github, stackOverflow, devTo } } }: Cv) =>
    section('On the Web', pairs([
      ['Web', website, new URL(website).hostname],
      ['GitHub', github, `@${lastSegment(github)}`],
      ['StackOverflow', stackOverflow, urlPath(stackOverflow).replace(/[^/]+$/, '')],
      ['dev.to', devTo, `@${lastSegment(devTo)}`],
    ])),

  mainTech: ({ profile }: Cv) => section('Main Tech', list(profile.mainTech)),

  contributions: ({ profile }: Cv) =>
    section('Contributions', list(profile.openSourceContributions.map(({ name, url }) => html`<a href="${url}">${name}</a>`), { raw: true })),

  upNext: ({ profile }: Cv) => section('Up Next', list(profile.upNext)),

  personality: ({ profile }: Cv) => section('Personality', list(profile.personality)),

  languages: ({ profile }: Cv) =>
    section('Languages', list(profile.languages.map(({ name, proficiency }) => `${name}: ${proficiency}`))),

  education: ({ education }: Cv) =>
    section('Education', list(education.map(({ degree, institution, startDate, endDate }) =>
      html`${degree}<br>${institution}, ${year(startDate)}–${year(endDate)}`), { raw: true })),

  highlights: ({ profile }: Cv) => section(null, list(profile.highlights)),
};

export const render = (cv: Cv, layout: Layout, css: string) => {
  const { name, headline } = cv.profile;
  const queue = [...cv.positions];
  const block = (spec: BlockName | { positions: number }) =>
    typeof spec === 'string' ? blocks[spec](cv) : queue.splice(0, spec.positions).map((position) => entry(cv, position)).join('');

  return html`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${name} | ${headline}</title>
<style>!${css}</style>
</head>
<body>
!${layout.pages.map(({
  title,
  main,
  sidebar,
  footer,
}) => html`
!${title ? html`<h1>${name} | ${headline}</h1>` : ''}
<div class="sheet">
  <aside>!${sidebar.map(block)}</aside>
  <main>
    !${main.map(block)}
    !${footer ? html`<footer><a href="${cv.profile.contact.linkedin}">View more on LinkedIn</a></footer>` : ''}
  </main>
</div>`)}
</body>
</html>
`;
};