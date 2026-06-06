import type { RouteRecord } from 'vite-react-ssg'
import Layout from './components/Layout'
import { projects } from './data/projects'

/**
 * Route table for vite-react-ssg. Every entry is statically pre-rendered to
 * its own HTML file. The dynamic project route expands via getStaticPaths into
 * one HTML page per artwork, each with its own SEO (<Seo> inside the page).
 */
export const routes: RouteRecord[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, lazy: () => import('./pages/Home') },
      { path: 'projects', lazy: () => import('./pages/ProjectsIndex') },
      {
        path: 'projects/:slug',
        lazy: () => import('./pages/ProjectDetail'),
        getStaticPaths: () => projects.map((p) => `/projects/${p.slug}`),
      },
      { path: 'essay', lazy: () => import('./pages/Essay') },
      { path: 'about', lazy: () => import('./pages/About') },
      { path: 'contact', lazy: () => import('./pages/Contact') },
      // Explicit /404 so the build emits dist/404.html (Vercel serves it, with a
      // 404 status, for any unknown path). The wildcard handles client-side SPA misses.
      { path: '404', lazy: () => import('./pages/NotFound') },
      { path: '*', lazy: () => import('./pages/NotFound') },
    ],
  },
]
