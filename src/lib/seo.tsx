import { Head } from 'vite-react-ssg'
import { site } from '@/data/site'

export interface SeoProps {
  /** Page title (the site name is appended automatically). */
  title?: string
  description?: string
  /** Absolute-from-root image path, e.g. "/images/foo/01.avif". */
  image?: string
  /** Route path for canonical + og:url, e.g. "/projects/loss". */
  path?: string
  /** og:type — "website" | "article" | "profile". */
  type?: 'website' | 'article' | 'profile'
  /** Optional JSON-LD structured data object(s). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  noIndex?: boolean
}

/**
 * Per-page SEO. Renders into <head> at static-build time via vite-react-ssg,
 * so every pre-rendered HTML file ships unique, crawlable metadata.
 */
export function Seo({
  title,
  description,
  image,
  path = '',
  type = 'website',
  jsonLd,
  noIndex,
}: SeoProps) {
  const fullTitle = title ? `${title} — ${site.name}` : `${site.name} | ${site.tagline}`
  // Fall back to the site description when a page passes an empty/undefined one
  // (some works have no blurb) so no page ships a blank meta description.
  const desc = description?.trim() ? description : site.description
  const url = `${site.url}${path}`
  const img = image ? `${site.url}${image}` : `${site.url}/og-default.jpg`
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={site.name} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {blocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Head>
  )
}

/** JSON-LD for the whole site / a page that represents the artist. */
export function personJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: 'Artist, Sculptor & Counsellor',
    url: site.url,
    email: `mailto:${site.email}`,
    telephone: site.phone,
    address: { '@type': 'PostalAddress', addressLocality: site.location, addressCountry: 'ZA' },
  }
}

/** JSON-LD for a single artwork/project. */
export function artworkJsonLd(p: {
  title: string
  description: string
  image: string
  medium: string
  year: string
  slug: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    name: p.title,
    creator: { '@type': 'Person', name: site.name },
    artMedium: p.medium,
    dateCreated: p.year,
    description: p.description,
    image: `${site.url}${p.image}`,
    url: `${site.url}/projects/${p.slug}`,
  }
}
