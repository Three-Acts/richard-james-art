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
| Framework | React 18 + TypeScript |
| Build / SSG | Vite 6 + [vite-react-ssg](https://github.com/Daydreamer-riri/vite-react-ssg) |
| Styling | Tailwind CSS v4 (CSS-first tokens) |
| Motion | GSAP + ScrollTrigger, Lenis smooth scroll |
| Images | `vite-plugin-image-optimizer` (sharp) — AVIF/WebP |
| Type | Cinzel (display) + Quattrocento (body), Google Fonts |
| Hosting | Vercel (static) |

## Develop

```bash
npm install
npm run dev        # http://localhost:5199  (port pinned — see note)
```

> **Port note:** the dev/preview port is pinned to **5199** in `vite.config.ts` because another local service occupies `localhost:5173` on this machine. Open `http://127.0.0.1:5199` if `localhost` misbehaves.

## Build & preview

```bash
npm run build      # vite-react-ssg build  +  sitemap generation  ->  dist/
npm run preview    # serve the static dist/
npm run typecheck  # tsc --noEmit
```

`npm run build` pre-renders 30 pages, optimizes images, and writes `dist/sitemap.xml`.

## Deploy (Vercel)

The repo includes `vercel.json` (framework `vite`, build `npm run build`, output `dist`, `cleanUrls`, the `/projetcs → /projects` redirect, and immutable caching for `/images`). Import the repo into Vercel and deploy — no extra config needed.

## Project structure

```
public/images/<slug>/NN.avif   # 94 real artwork images, by project
scripts/                       # gen-sitemap.mjs, gen-og.mjs
src/
  App.tsx  main.tsx            # routes (vite-react-ssg) + entry
  data/                        # projects, site, pages (content)
  lib/                         # gsap, useLenis, seo, structuredData
  components/
    Layout Nav Menu Preloader Footer
    home/                      # CenterStage VerticalTrack TitlePlate YearFilter + useHomeScroll
    project/                   # Hero ProjectMeta Gallery NextProject
    ui/                        # Image (blur-up) · Reveal (scroll reveal)
  pages/                       # Home, ProjectDetail, ProjectsIndex, Essay, About, Contact, NotFound
  styles/global.css            # Tailwind v4 tokens + design system
```

## Content

Real content from the live site (titles, years, mediums, descriptions, the essay, bio and contact) lives in `src/data/`. Artwork imagery belongs to the artist and is included for this prototype.
