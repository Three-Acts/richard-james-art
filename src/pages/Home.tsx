import { Link } from 'react-router-dom'
import { Seo, personJsonLd } from '@/lib/seo'
import { projects } from '@/data/projects'
import { site } from '@/data/site'
import HomeExperience from '@/components/home/HomeExperience'

/**
 * Home — the signature, scroll-synced cinematic experience.
 *
 * The interactive stage lives in <HomeExperience> (client-enhanced). This page
 * module also ships a content-complete, crawlable fallback: a visually-hidden
 * heading + a full list of every project link, so search engines and no-JS
 * visitors get all 25 works even though the fancy mechanic never runs for them.
 */
export function Component() {
  const first = projects[0]

  return (
    <>
      <Seo
        path="/"
        title={undefined}
        description={site.description}
        image={first.hero}
        type="website"
        jsonLd={personJsonLd()}
      />

      {/* Visually-hidden, crawlable index of the whole portfolio. Present in
          the pre-rendered HTML regardless of JavaScript. */}
      <h1 className="sr-only">
        {site.name} — {site.tagline}
      </h1>
      <nav aria-label="All projects" className="sr-only">
        <ul>
          {projects.map((p) => (
            <li key={p.slug}>
              <Link to={`/projects/${p.slug}`}>
                {p.title} — {p.year}, {p.medium}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <HomeExperience />
    </>
  )
}
