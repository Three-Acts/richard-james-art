import { useParams, Link } from 'react-router-dom'
import { Seo, artworkJsonLd } from '@/lib/seo'
import { projects, projectsBySlug } from '@/data/projects'
import Hero from '@/components/project/Hero'
import ProjectMeta from '@/components/project/ProjectMeta'
import Gallery from '@/components/project/Gallery'
import NextProject from '@/components/project/NextProject'

/**
 * Project detail — cinematic, dark, normal Lenis scroll.
 * Hero → ProjectMeta → Gallery → NextProject.
 *
 * SSG pre-renders one page per slug, so `p` is normally always found; the
 * not-found branch is a graceful fallback for any stray client navigation.
 */
export function Component() {
  const { slug = '' } = useParams()
  const p = projectsBySlug[slug]

  if (!p) {
    return (
      <>
        <Seo title="Not found" path={`/projects/${slug}`} noIndex />
        <section className="u-container grid min-h-[70svh] place-content-center gap-6 py-32 text-center">
          <p className="u-eyebrow text-gold">404</p>
          <h1 className="u-display text-[clamp(2rem,6vw,4rem)] text-bone">
            Work not found
          </h1>
          <p className="font-body text-bone-dim">
            That project could not be located.
          </p>
          <div className="mt-2 flex justify-center">
            <Link to="/" className="btn-line">
              View all works
            </Link>
          </div>
        </section>
      </>
    )
  }

  const index = projects.findIndex((proj) => proj.slug === p.slug) + 1
  const next = projectsBySlug[p.next] ?? projects[0]

  return (
    <>
      <Seo
        title={p.title}
        description={p.metaDescription}
        image={p.hero}
        path={`/projects/${p.slug}`}
        type="article"
        jsonLd={artworkJsonLd({
          title: p.title,
          description: p.description,
          image: p.hero,
          medium: p.medium,
          year: p.year,
          slug: p.slug,
        })}
      />

      <article>
        <Hero project={p} index={index} total={projects.length} />
        <ProjectMeta project={p} />
        <Gallery project={p} />
        <NextProject next={next} />
      </article>
    </>
  )
}
