export type Social = {
  id: string;
  label: string;
  handle: string;
  url: string;
  show: boolean;
  glyph: string;
  selectable?: boolean;
  rel?: string;
  note?: string;
};

export const email = 'xenomirant@gmail.com';

export const socials: Social[] = [
  { id: 'email', label: 'email', handle: 'xenomirant <at> gmail <dot> com', url: `mailto:${email}`, show: true, glyph: 'mail' },
  { id: 'tgblog', label: 'telegram blog', handle: 'pseudorandom_search', url: 'https://t.me/pseudorandom_search', show: true, glyph: 'telegram', note: 'in russian' },
  { id: 'x', label: 'x', handle: '@xenodonkey', url: 'https://x.com/xenodonkey', show: true, glyph: 'x' },
  { id: 'linkedin', label: 'linkedin', handle: 'in/xenomirant', url: 'https://www.linkedin.com/in/xenomirant/', show: true, glyph: 'linkedin' },
  { id: 'discord', label: 'discord', handle: 'xenomirant', url: '', show: true, glyph: 'discord', selectable: true },
  { id: 'github', label: 'github', handle: 'Xenomirant', url: 'https://github.com/Xenomirant', show: true, glyph: 'github' },
  { id: 'lesswrong', label: 'lesswrong', handle: 'xenomirant', url: 'https://www.lesswrong.com/users/xenomirant', show: true, glyph: 'lw' },
  { id: 'hf', label: 'hugging face', handle: 'xenomirant', url: 'https://huggingface.co/xenomirant', show: true, glyph: 'hf' },
  { id: 'orcid', label: 'orcid', handle: '0000-0003-1899-4405', url: 'https://orcid.org/0000-0003-1899-4405', show: true, glyph: 'orcid' },
  { id: 'scholar', label: 'semantic scholar', handle: '2339664654', url: 'https://www.semanticscholar.org/author/2339664654', show: true, glyph: 'book' },
  { id: 'gscholar', label: 'google scholar', handle: 'GexSENwAAAAJ', url: 'https://scholar.google.com/citations?user=GexSENwAAAAJ', show: false, glyph: 'book' },
];

export const shown = socials.filter((s) => s.show);
/** the short row under the hero / in the footer */
export const hits = shown.filter((s) => ['email', 'tgblog', 'x', 'github', 'lesswrong', 'linkedin'].includes(s.id));
