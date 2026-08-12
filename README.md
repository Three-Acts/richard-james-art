# Richard James — Portfolio

A cinematic recreation + enhancement of [richardjamesart.com](https://www.richardjamesart.com/) for Richard James, a South African / UK artist based in Gqeberha (Port Elizabeth), South Africa. Statically generated, SEO-complete, and deployed on Vercel.

## Highlights

- **Cinematic home** — a once-per-session preloader, then a scroll-synced stage: the centred artwork cross-fades in lockstep with a far-right vertical thumbnail **track**, a bottom **title plate** (Cinzel), and a left **year filter** (2022–2025). Wheel, drag, keyboard (↑/↓, Home/End) and thumbnail/year clicks all drive the same active index. Collapses to a full-width hero + horizontal swipe strip on mobile.
- **Project pages** — full-bleed parallax hero, "slide text", and a free-form masonry **gallery** (2 columns desktop / 1 column mobile, natural aspect ratios) with staggered scroll reveals.
- **Content** — a Slideshow/Grid toggle on the home page (the grid is the year-filtered works index), the full essay *The Unborn Rags of the Mind*, About, and Contact (copy-to-clipboard).
- **Static + SEO** — every route is pre-rendered to its own HTML file with unique `<title>`, meta, Open Graph/Twitter, canonical and JSON-LD (`VisualArtwork`, `Person`). `sitemap.xml`, `robots.txt` and an OG image are generated at build.

## Stack

| | |
|---|---|
| Build / SSG | [Astro](https://astro.build) 7 (Vite 8 under the hood) + TypeScript |
| Interactivity | React 18 islands — the home stage and the fullscreen viewer only |
| Styling | Tailwind CSS v4 (CSS-first tokens), via `@tailwindcss/vite` |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll |
| Images | `vite-plugin-image-optimizer` (sharp) — AVIF/WebP |
| Type | Cinzel (display) + Quattrocento (body), Google Fonts |
| Hosting | Vercel (static) |

### Why islands

Astro renders every page to HTML at build time and ships JavaScript only where a
page is genuinely interactive. The gesture engine in `src/lib/carousel` needs
React, so the home stage hydrates eagerly (`client:load`) and the lightbox — which
shares that engine — is pulled in by a dynamic import on the first click. Nothing
else on the site ships a framework: the nav, menu, preloader, scroll reveals and
image fades are all a few dozen lines of DOM wiring.

What each page actually loads:

| Page | JS (raw) | Notes |
|---|---|---|
| About / Essay / Contact / 404 | ~40 kB | Lenis + reveals; no React, no GSAP |
| Project detail | ~157 kB | adds GSAP for the hero + next-project parallax |
| Home | ~391 kB | adds React + the carousel — it *is* the page |
| Lightbox | on click | React + gesture engine, fetched only when opened |

Cross-page navigation uses Astro's `<ClientRouter />`, so it still feels like the
single-page app this replaced: no white flash, and one Lenis instance survives
every navigation.

## Develop

```bash
npm install
npm run dev        # http://localhost:5199  (port pinned — see note)
```

> **Port note:** the dev/preview port is pinned to **5199** in `astro.config.mjs` because another local service occupies `localhost:5173` on this machine. Open `http://127.0.0.1:5199` if `localhost` misbehaves.

## Build & preview

```bash
npm run build      # image prep  +  astro build  +  sitemap generation  ->  dist/
npm run preview    # serve the static dist/
npm run typecheck  # astro check
```

`npm run build` pre-renders 45 pages, optimizes images, and writes `dist/sitemap.xml`.

## Deploy (Vercel)

The repo includes `vercel.json` (framework `astro`, build `npm run build`, output `dist`, `cleanUrls`, the `/projetcs → /projects` redirect, and immutable caching for `/images`). Import the repo into Vercel and deploy — no extra config needed.

`astro.config.mjs` sets `build.format: 'file'`, so the output stays flat
(`dist/about.html`, `dist/projects/loss.html`) — which is what `cleanUrls` +
`trailingSlash: false` expect, and what `scripts/gen-sitemap.mjs` walks.

## Project structure

`.astro` files render to HTML with no client JS; `.tsx` files are React islands.

```
public/images/<slug>/NN.avif   # 94 real artwork images, by project
scripts/                       # prepare-images.mjs, gen-sitemap.mjs, gen-og.mjs
src/
  pages/                       # file-based routes — index, about, essay,
                               #   contact, 404, projects/[slug]
  layouts/Base.astro           # <head>, ClientRouter, nav/preloader/footer shell
  data/                        # projects, site, pages (content)
  lib/                         # gsap · carousel/ · lenis · scrollSync
                               #   reveal · imageFade · pageScript · structuredData
  scripts/shell.ts             # the app shell: Lenis, reveals, scroll reset
  components/
    Seo Nav Menu Preloader Footer          (.astro)
    home/                      # the one eager island: CenterStage VerticalTrack
                               #   TitlePlate YearFilter ProjectsGrid
    project/                   # Hero ProjectMeta Gallery NextProject (.astro)
                               #   Lightbox + mountLightbox (React, on demand)
    ui/                        # Image (blur-up) · Reveal (scroll reveal)
                               #   — .astro for pages, .tsx for islands
  styles/global.css            # Tailwind v4 tokens + design system
```

`lib/pageScript.ts` is worth knowing about: Astro bundles component `<script>`
tags as ES modules, which the browser evaluates once per session. Anything that
binds to the DOM has to re-run after each `ClientRouter` navigation, and anything
bound to `window`/`document` has to be released before the swap — `onEachPage()`
handles both.

## Content

Real content from the live site (titles, years, mediums, descriptions, the essay, bio and contact) lives in `src/data/`. Artwork imagery belongs to the artist and is included for this prototype.
