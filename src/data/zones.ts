export type Zone = { n: number; label: string; href: string; external?: boolean; nav: boolean };

export const zones: Zone[] = [
  { n: 0, label: 'index', href: '/', nav: true },
  { n: 1, label: 'now', href: '/now/', nav: true },
  { n: 2, label: 'writing', href: '/writing/', nav: true },
  { n: 3, label: 'papers', href: '/papers/', nav: true },
  { n: 4, label: 'projects', href: '/projects/', nav: true },
  { n: 5, label: 'about', href: '/about/', nav: true },
  { n: 6, label: 'contact', href: '/contact/', nav: true },
  { n: 7, label: 'elsewhere', href: '/about/#elsewhere', nav: false },
  { n: 8, label: 'feed', href: '/rss.xml', nav: false },
  { n: 9, label: 'cv', href: '/CV.pdf', external: true, nav: true },
];

/** numogram syzygies: each zone pairs with 9 - n */
export const syzygy = (n: number): Zone => zones[9 - n];
export const zoneOf = (n: number): Zone => zones[n];
