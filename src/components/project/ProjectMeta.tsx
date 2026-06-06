import { Link } from 'react-router-dom'
import type { Project } from '@/types'
import Reveal from '@/components/ui/Reveal'

interface ProjectMetaProps {
  project: Project
}

/**
 * Refined meta block: a quiet two-column "Year / Medium" header rule, then the
 * work's "slide text" set in a centred reading column with generous space, and
 * an outlined link through to the long-form essay. Description may be empty for
 * some works — in that case the prose + essay link are simply omitted.
 */
export default function ProjectMeta({ project }: ProjectMetaProps) {
  const hasText = project.description.trim().length > 0

  return (
    <section className="u-container py-[clamp(4rem,12vh,9rem)]">
      {/* Meta rule */}
      <Reveal>
        <dl className="grid grid-cols-1 gap-y-8 border-t border-line pt-8 sm:grid-cols-2 sm:gap-x-12">
          <div className="flex flex-col gap-2">
            <dt className="u-eyebrow">Year</dt>
            <dd className="u-display text-lg tracking-[0.14em] text-bone">
              {project.year}
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="u-eyebrow">Medium / Dimensions</dt>
            <dd className="font-body text-base leading-relaxed text-bone-dim">
              {project.medium}
            </dd>
          </div>
        </dl>
      </Reveal>

      {/* Slide text + essay link */}
      {hasText && (
        <Reveal delay={0.08}>
          <div className="u-prose mx-auto mt-[clamp(3rem,8vh,6rem)]">
            <p className="text-balance text-center font-body text-[clamp(1.05rem,1.6vw,1.35rem)] leading-[1.85] text-bone-dim">
              {project.description}
            </p>
            <div className="mt-12 flex justify-center">
              <Link to="/essay" className="btn-line" aria-label="Read the essay">
                Read Essay
              </Link>
            </div>
          </div>
        </Reveal>
      )}
    </section>
  )
}
