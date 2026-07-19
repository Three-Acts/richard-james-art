/**
 * Optional JSON-LD builders — pure, side-effect-free helpers that return plain
 * schema.org objects. Pages can pass these to <Seo jsonLd={...} /> to enrich
 * structured data without touching seo.tsx (which already ships Person /
 * VisualArtwork builders).
 *
 * Everything is typed as Record<string, unknown> so it slots straight into the
 * Seo `jsonLd` prop, and every URL is absolutised against site.url.
 */
import { site } from '@/data/site'
import { projects } from '@/data/projects'

type JsonLd = Record<string, unknown>

/** Join site.url with a root-absolute path, collapsing any double slash. */
function abs(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${site.url}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Site-level WebSite node. Identifies the canonical origin and publisher.
 */
export function websiteJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    alternateName: site.tagline,
    url: site.url,
    logo: `${site.url}/favicon.svg`,
    sameAs: ['https://richard-james-art.vercel.app/'],
    description: site.description,
    inLanguage: 'en',
    publisher: {
      '@type': 'Person',
      name: site.name,
      url: site.url,
    },
  }
}

/**
 * BreadcrumbList for the current page. Pass an ordered trail of crumbs from the
 * site root to the active page, e.g.
 *   breadcrumbJsonLd([
 *     { name: 'Home', path: '/' },
 *     { name: 'Projects', path: '/projects' },
 *     { name: 'Loss', path: '/projects/loss' },
 *   ])
 */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  }
}

/**
 * ImageGallery node for a single project page — describes the work as a
 * collection of images attributed to the artist. Complements artworkJsonLd
 * (VisualArtwork) by enumerating every associated image.
 */
export function imageGalleryJsonLd(p: {
  title: string
  images: string[]
  slug: string
  description?: string
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: p.title,
    url: abs(`/projects/${p.slug}`),
    ...(p.description ? { description: p.description } : {}),
    isPartOf: { '@type': 'WebSite', name: site.name, url: site.url },
    author: { '@type': 'Person', name: site.name, url: site.url },
    associatedMedia: p.images.map((src, i) => ({
      '@type': 'ImageObject',
      contentUrl: abs(src),
      name: `${p.title} — ${i + 1}`,
    })),
  }
}

/**
 * CollectionPage for the home page, which hosts the full works grid (the
 * standalone /projects index was folded into it). Lists every project as a
 * VisualArtwork so the full body of work is discoverable from one node.
 */
export function collectionJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${site.name} — Works`,
    url: abs('/'),
    description: site.description,
    isPartOf: { '@type': 'WebSite', name: site.name, url: site.url },
    author: { '@type': 'Person', name: site.name, url: site.url },
    hasPart: {
      '@type': 'ItemList',
      numberOfItems: projects.length,
      itemListElement: projects.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: abs(`/projects/${p.slug}`),
        item: {
          '@type': 'VisualArtwork',
          name: p.title,
          url: abs(`/projects/${p.slug}`),
          image: abs(p.thumb),
          artMedium: p.medium,
          dateCreated: p.year,
          creator: { '@type': 'Person', name: site.name },
        },
      })),
    },
  }
}
