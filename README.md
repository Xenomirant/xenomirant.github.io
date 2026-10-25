# xenomirant.github.io

Personal site of Sergei Kudriashov. Astro + MDX, static, dark only, deployed to GitHub Pages by `.github/workflows/deploy.yml`.

## Stack

- [Astro](https://astro.build) (static output, Content Layer collections), `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`
- `remark-math` + `rehype-katex` (KaTeX CSS loads only on pages with `math: true`), Shiki `vesper`
- Fonts: IBM Plex Mono (ui), Source Serif 4 (prose), self-hosted via Fontsource
- Images: `astro:assets` (sharp) for the hero; `scripts/photos.mjs` for the dithered two-ink PNGs
- No client frameworks. One small vanilla script, `src/scripts/site.ts`.

## Run

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # astro check && astro build → dist/
npm run preview
npm run photos     # regenerate public/img/* from photos/ (originals are gitignored)
```

Node ≥ 22. The build is static; push to `main` and the workflow publishes.

## Where things live

```
src/content.config.ts     collection schemas (zod) — frontmatter must validate
src/content/posts/        writing (local mdx + external stubs)
src/content/papers/       one file per paper (data only, no pages)
src/content/projects/     one file per project (data only, no pages)
src/content/now/          dated log entries, YYYY-MM-DD.mdx
src/content/future/       short notes for /future/, one file each
src/content/about.mdx     the long bio (plain mdx import, not a collection)
src/data/                 meta.ts, socials.ts, zones.ts
src/components/           Row*.astro, NowBlock, Hero, Chat, StatusBar, Footer, mdx/*
src/pages/                routes; lists only for papers/projects
src/styles/               tokens → base → type → layout → lists → components → effects → print
public/CV.pdf             the cv; /cv/ redirects to it
```

Slugs are file names: `src/content/posts/foo.mdx` → `/writing/foo/`, `src/content/now/2026-10-20.mdx` → `/now/2026-10-20/`.

## Add a post

`src/content/posts/my-note.mdx`

```mdx
---
title: Reflections on unlearning and inoculation
date: 2026-09-20
description: One paragraph. Shows in the list and in the feed.
tags: [unlearning, evals]
lang: en            # or ru
math: false         # true loads KaTeX
source: local       # local | lesswrong | telegram
---

Body in MDX. Components available without import: <Aside>, <Figure>, <Cite>, <Sigil>.
```

A LessWrong cross-post is a stub: same frontmatter plus

```yaml
source: lesswrong
externalUrl: https://www.lesswrong.com/posts/GnG2ono8vdoJvyF9f/...
coauthors: [Sami Wolf]   # optional
karma: 17                # optional
```

The stub page shows the description, links out, forwards after six seconds, sets `rel=canonical` to the external URL and `noindex`. `draft: true` hides a post everywhere.

## Add a paper

`src/content/papers/short-slug.mdx` (body is ignored; everything is frontmatter)

```yaml
---
title: "Shrink the Longest: Improving Latent Space Isotropy with Simplicial Geometry"
authors: [Sergei Kudriashov, Olesya Karpik, Eduard Klyshinsky]
me: Sergei Kudriashov
role: first              # first | co-first | coauthor
venue: Analysis of Images, Social Networks and Texts (AIST 2024), LNCS 15419
venueShort: AIST 2024
venueType: conference    # conference | workshop | preprint | submitted | report | thesis
status: published        # published | accepted | submitted | preprint
year: 2024
date: 2024-12-01
tags: [geometry, embeddings]
tldr: One to three sentences. This is the row body.
links:
  - { label: paper, url: https://doi.org/10.1007/978-3-031-88036-0_6 }
  - { label: arxiv, url: https://arxiv.org/abs/2501.05502 }
  - { label: code, url: https://github.com/Xenomirant/Shrink-the-longest }
featured: true           # shows on the homepage (max 3)
group: main              # main | linguistics (collapsed group)
note: optional one-liner under the row
---
```

Rows are numbered `§3.N` in chronological order across the whole collection, so numbers stay stable as newer papers are added.

## Add a project

`src/content/projects/short-slug.mdx`

```yaml
---
title: AI Safety Connections
date: 2026-05-13
period: 2026
status: ongoing          # ongoing | done | dormant
kind: tool               # research | tool | competition | teaching | fieldwork | thesis
with: [Jamilya Erkenova]
org: Monoid AI Safety Hub
award: 1st of 177        # optional → amber chip
tldr: One to three sentences.
links:
  - { label: play, url: https://ai-safety-connections.vercel.app }
  - { label: code, url: https://github.com/erkenovaj/building-connections }
tags: [evals, teaching]
---
```

`teaching` and `fieldwork` kinds are listed in their own block under the main groups.

## Add a now entry

`src/content/now/2026-10-20.mdx`

```mdx
---
date: 2026-10-20
where: Shenzhen
tz: Asia/Shanghai
utcOffset: "+8"
mood: deadpan, slightly jetlagged
---

## working on
- online rl distillation
- re-tokenization invariance (mars v)

## reading
- poggio et al., compositional sparsity
```

`h2` headings render as `[ label ]` eyebrows and lists as dashed rows. The newest entry also appears on the homepage until it is older than `staleNowDays` (60) in `src/data/meta.ts`; the footer clock uses its `tz`.

## Add a note to the future page

`src/content/future/2026-10-21-some-slug.md`

```md
---
date: 2026-10-21
kind: note        # note | idea | find
links:            # optional chips under the note
  - { label: paper, url: https://arxiv.org/abs/... }
---
One sentence or a short paragraph. Markdown links work.
```

To add a longer elaboration that opens from a flickering dot after the note, name the file `.mdx` and wrap the extra paragraphs in `<More>` on their own lines:

```mdx
The short note.

<More>

Longer elaboration, any number of paragraphs.

</More>
```

Notes are listed newest first; each one has an anchor at `/future/#<file name>`. The research interests beside them are edited in `src/pages/future.astro`.

## Photos

Put originals in `photos/` (gitignored) and run `npm run photos`. It writes `src/assets/hero.jpg` (homepage, via `<Picture>`) and the dithered PNGs in `public/img/` (`about-1280.png`, `contact-1600.png`, `projects-1280.png`, `ribbon-tile.png`, `grille-tile.png`, `og.jpg`). Every page guards for a missing file, so the site builds without them.

## Licence

Code: MIT (see `LICENSE`). Writing in `src/content/`: CC BY 4.0. Photographs: all rights reserved.
