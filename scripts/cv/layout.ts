// What goes where on the printed CV. Content comes from src/data/cv.json as is;
// this file only decides which parts appear on which of the two A4 pages.
// Roles appear in src/data/cv.json order; pages just take the next n of them.

import type { Layout } from './template.ts';

export default {
  pages: [
    {
      title: true,
      sidebar: ['contact', 'web', 'mainTech', 'contributions', 'upNext'],
      main: ['highlights', { positions: 5 }],
    },
    {
      sidebar: ['personality', 'languages', 'education'],
      main: [{ positions: 5 }],
      footer: true,
    },
  ],
} satisfies Layout;
