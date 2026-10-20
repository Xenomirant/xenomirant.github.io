/** tiny date / text helpers shared by pages and row components. */

const DAY = 86_400_000;

/** 2026-10-20T… → '2026.10.20' (utc) */
export const fmtDate = (d: Date): string => d.toISOString().slice(0, 10).replaceAll('-', '.');

/** iso date for <time datetime> */
export const isoDate = (d: Date): string => d.toISOString().slice(0, 10);

/** whole days between two dates (absolute) */
export const daysBetween = (a: Date, b: Date): number => Math.round(Math.abs(a.valueOf() - b.valueOf()) / DAY);

/** days from a date until now */
export const daysAgo = (d: Date, now: Date = new Date()): number => Math.floor((now.valueOf() - d.valueOf()) / DAY);

/** minutes to read, at a dry 230 wpm; never below 1 */
export const readingTime = (words: number): number => Math.max(1, Math.round(words / 230));

/** word count of a markdown body, ignoring frontmatter-ish noise */
export const wordCount = (body: string | undefined): number => (body ?? '').trim().split(/\s+/).filter(Boolean).length;

/** sort newest first by `data.date` */
export const byDateDesc = <T extends { data: { date: Date } }>(a: T, b: T): number => b.data.date.valueOf() - a.data.date.valueOf();
export const byDateAsc = <T extends { data: { date: Date } }>(a: T, b: T): number => a.data.date.valueOf() - b.data.date.valueOf();

/** does this author string denote `me`? exact match, or same surname. */
export const isMe = (author: string, me: string): boolean => {
  if (author === me) return true;
  const last = (s: string) => s.trim().split(/\s+/).pop()?.toLowerCase().replace(/[.,]/g, '');
  return last(author) === last(me);
};
