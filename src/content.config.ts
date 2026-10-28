import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const link = z.object({ label: z.string(), url: z.url() });

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    lang: z.enum(['en', 'ru']).default('en'),
    math: z.boolean().default(false),
    source: z.enum(['local', 'lesswrong', 'telegram']).default('local'),
    crosspost: z.enum(['excerpt', 'full', 'none']).default('none'),
    externalUrl: z.url().optional(),
    canonicalUrl: z.url().optional(),
    coauthors: z.array(z.string()).default([]),
    karma: z.number().optional(),
    readingTime: z.number().optional(),
    draft: z.boolean().default(false),
    // optional background art behind the post (see components/EraBg.astro)
    bg: z.enum(['bruegel', 'panopticon']).optional(),
  }),
});

const papers = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/papers' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    me: z.string().default('Sergei Kudriashov'),
    role: z.enum(['first', 'co-first', 'coauthor']),
    venue: z.string(),
    venueShort: z.string(),
    venueType: z.enum(['conference', 'workshop', 'preprint', 'submitted', 'report', 'thesis']),
    status: z.enum(['published', 'accepted', 'submitted', 'preprint']),
    year: z.number(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    tldr: z.string(),
    links: z.array(link).min(1),
    featured: z.boolean().default(false),
    group: z.enum(['main', 'linguistics']).default('main'),
    note: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    period: z.string(),
    status: z.enum(['ongoing', 'done', 'dormant']),
    kind: z.enum(['research', 'tool', 'competition', 'teaching', 'fieldwork', 'thesis']),
    with: z.array(z.string()).default([]),
    org: z.string().optional(),
    award: z.string().optional(),
    tldr: z.string(),
    links: z.array(link).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

const now = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/now' }),
  schema: z.object({
    date: z.coerce.date(),
    where: z.string(),
    tz: z.string(),
    utcOffset: z.string(),
    mood: z.string().optional(),
  }),
});

// the future page: short notes, project ideas, finds. one file each; the body is a sentence or a paragraph.
const future = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/future' }),
  schema: z.object({
    date: z.coerce.date(),
    kind: z.enum(['note', 'idea', 'find']).default('note'),
    links: z.array(link).default([]),
  }),
});

export const collections = { posts, papers, projects, now, future };
