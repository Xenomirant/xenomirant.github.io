/** a BibTeX @misc entry for a blog post. plain-BibTeX friendly: the url goes in howpublished, which every style prints. */
import { meta } from '@/data/meta';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const STOP = new Set(['a', 'an', 'the', 'on', 'of', 'in', 'and', 'to', 'for', 'is', 'why', 'how', 'what']);

/** escape the characters LaTeX treats specially */
const tex = (s: string): string =>
  s.replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');

/** 'Sergei Kudriashov' → 'Kudriashov, Sergei' */
const lastFirst = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  return parts.length < 2 ? name : `${parts.at(-1)}, ${parts.slice(0, -1).join(' ')}`;
};

const ascii = (s: string): string => s.normalize('NFKD').replace(/[^\w]/g, '').toLowerCase();

export function bibtex(p: { title: string; date: Date; url: string; coauthors?: string[] }): string {
  const authors = [meta.name, ...(p.coauthors ?? [])];
  const year = p.date.getUTCFullYear();
  const word = p.title.split(/\s+/).map(ascii).find((w) => w && !STOP.has(w)) ?? 'post';
  const key = `${ascii(meta.name.split(/\s+/).at(-1) ?? meta.handle)}${year}${word}`;
  const fields: [string, string][] = [
    ['author', `{${authors.map((a) => tex(lastFirst(a))).join(' and ')}}`],
    // double braces keep the title's casing in styles that lowercase titles
    ['title', `{{${tex(p.title)}}}`],
    ['year', `{${year}}`],
    ['month', MONTHS[p.date.getUTCMonth()]],
    ['howpublished', `{\\url{${p.url}}}`],
    ['note', '{Blog post}'],
  ];
  const w = Math.max(...fields.map(([k]) => k.length));
  return `@misc{${key},\n${fields.map(([k, v]) => `  ${k.padEnd(w)} = ${v}`).join(',\n')}\n}`;
}
