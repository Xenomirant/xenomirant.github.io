/** /og/<post>.png: the share card for each local post (see src/lib/og.ts) */
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { card } from '@/lib/og';
import { fmtDate, readingTime, wordCount } from '@/lib/fmt';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft && !(data.source !== 'local' && data.externalUrl));
  return posts.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}

export async function GET({ props }: APIContext<{ entry: CollectionEntry<'posts'> }>) {
  const { entry } = props;
  const { data } = entry;
  const png = await card({
    slug: entry.id,
    title: data.title,
    description: data.description,
    date: fmtDate(data.date),
    minutes: data.readingTime ?? readingTime(wordCount(entry.body)),
    bg: data.bg,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
