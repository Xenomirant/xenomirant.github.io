export type Era = 'past' | 'present' | 'future';
export type Zone = { n: number; label: string; href: string; era: Era; external?: boolean; nav: boolean };

export const zones: Zone[] = [
  { n: 0, label: 'index', href: '/', era: 'present', nav: false },
  { n: 1, label: 'now', href: '/now/', era: 'present', nav: true },
  { n: 2, label: 'writing', href: '/writing/', era: 'past', nav: true },
  { n: 3, label: 'papers', href: '/papers/', era: 'past', nav: true },
  { n: 4, label: 'projects', href: '/projects/', era: 'past', nav: true },
  { n: 5, label: 'about', href: '/about/', era: 'past', nav: true },
  { n: 6, label: 'contact', href: '/contact/', era: 'present', nav: true },
  { n: 7, label: 'future', href: '/future/', era: 'future', nav: true },
  { n: 8, label: 'feed', href: '/rss.xml', era: 'present', nav: false },
  { n: 9, label: 'cv', href: '/CV.pdf', era: 'present', external: true, nav: true },
];

export const eras: Era[] = ['past', 'present', 'future'];
/** nav entries grouped by era, in reading order; cv is listed apart. */
export const byEra = (e: Era) => zones.filter((z) => z.nav && z.era === e && !z.external);
export const cv = zones[9];
export const eraOf = (n?: number): Era => (n === undefined ? 'present' : zones[n]?.era ?? 'present');

/** numogram syzygies: each zone pairs with 9 - n */
export const syzygy = (n: number): Zone => zones[9 - n];
export const zoneOf = (n: number): Zone => zones[n];
