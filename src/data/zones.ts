export type Era = 'past' | 'present' | 'future';
export type Zone = { n: number; label: string; short?: string; href: string; era: Era; external?: boolean; nav: boolean };

export const zones: Zone[] = [
  { n: 0, label: 'index', href: '/', era: 'present', nav: false },
  { n: 1, label: 'now', href: '/now/', era: 'present', nav: true },
  { n: 2, label: 'blog', href: '/writing/', era: 'past', nav: true },
  { n: 3, label: 'papers', href: '/papers/', era: 'past', nav: true },
  { n: 4, label: 'projects', href: '/projects/', era: 'past', nav: true },
  { n: 5, label: 'about', href: '/about/', era: 'past', nav: false },
  { n: 6, label: 'connect', href: '/connect/', era: 'present', nav: true },
  { n: 7, label: 'the future is', short: 'future', href: '/future/', era: 'future', nav: true },
  { n: 8, label: 'feed', href: '/rss.xml', era: 'present', nav: false },
  { n: 9, label: 'cv', href: '/CV.pdf', era: 'present', external: true, nav: true },
];

/** the navigation is the three eras: the past (with pages under it), the present, the future is … */
export type Branch = { era: Era; label: string; zone?: Zone; children: Zone[] };
export const tree: Branch[] = [
  { era: 'past', label: 'the past', children: [zones[2], zones[3], zones[4]] },
  { era: 'present', label: 'the present', children: [zones[1], zones[6]] },
  { era: 'future', label: 'the future is', zone: zones[7], children: [] },
];
/** flat list for the phone bar */
export const flat: Zone[] = [zones[2], zones[3], zones[4], zones[1], zones[6], zones[7]];
export const cv = zones[9];
export const eraOf = (n?: number): Era => (n === undefined ? 'present' : zones[n]?.era ?? 'present');

/** numogram syzygies: each zone pairs with 9 - n */
export const syzygy = (n: number): Zone => zones[9 - n];
export const zoneOf = (n: number): Zone => zones[n];
