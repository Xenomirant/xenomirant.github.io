import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { meta } from '@/data/meta';
import { byDateDesc } from '@/lib/fmt';

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(byDateDesc);
  const site = context.site ?? new URL(meta.site);
  return rss({
    title: `${meta.name} · writing`,
    description: 'random notes from random places.',
    site,
    trailingSlash: true,
    items: posts.map((p) => {
      const stub = p.data.source !== 'local' && !!p.data.externalUrl;
      const link = stub ? p.data.externalUrl! : `/writing/${p.id}/`;
      return {
        title: p.data.title,
        pubDate: p.data.date,
        description: p.data.description,
        link,
        categories: [...p.data.tags, p.data.source],
        ...(p.data.coauthors.length ? { author: [meta.name, ...p.data.coauthors].join(', ') } : {}),
      };
    }),
    customData: `<language>en</language>`,
  });
}
