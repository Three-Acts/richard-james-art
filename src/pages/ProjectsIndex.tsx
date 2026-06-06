import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Seo } from '@/lib/seo'
import { projects, projectsByYear, years } from '@/data/projects'
import type { Project } from '@/types'
import Image from '@/components/ui/Image'
import Reveal from '@/components/ui/Reveal'

/** Tabs: "All" + each year, oldest→newest reversed so the newest reads first. */
const FILTERS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  ...[...years].reverse().map((y) => ({ label: y, value: y })),
]

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <Reveal
      as="li"
      // Cap the stagger so a freshly-filtered short list still feels lively.
      delay={Math.min(index, 5) * 0.06}
      className="group"
    >
      <Link
        to={`/projects/${project.slug}`}
        className="block focus-visible:outline-none"
        aria-label={`${project.title}, ${project.year}`}
      >
        <div className="relative overflow-hidden bg-ink-soft">
          <Image
            src={project.thumb}
            alt={project.title}
            aspectRatio="4/5"
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="h-full w-full transition-transform duration-[1.2s] ease-out-expo will-change-transform group-hover:scale-[1.04]"
          />
          {/* Gold hairline that draws in on hover. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-700 ease-out-expo group-hover:border-gold/40"
          />
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h2 className="u-display text-balance text-base leading-tight text-bone transition-colors duration-500 ease-out-expo group-hover:text-gold-bright sm:text-lg">
            {project.title}
          </h2>
          <span className="u-eyebrow shrink-0 translate-y-[-1px] text-faint transition-colors duration-500 ease-out-expo group-hover:text-gold">
            {project.year}
          </span>
        </div>

        {project.medium && (
          <p className="mt-1.5 line-clamp-1 text-[0.82rem] leading-relaxed text-muted">
            {project.medium}
          </p>
        )}
      </Link>
    </Reveal>
  )
}

export function Component() {
  const [active, setActive] = useState<string | null>(null)

  const shown = useMemo(() => projectsByYear(active), [active])

  return (
    <>
      <Seo title="Projects" path="/projects" />

      <section className="u-container pb-32 pt-[calc(var(--nav-h)+clamp(4rem,12vw,9rem))]">
        {/* Header */}
        <Reveal as="header" className="max-w-3xl">
          <p className="u-eyebrow text-gold">The Work</p>
          <h1 className="u-display mt-5 text-[clamp(2.5rem,7vw,5rem)] leading-[0.98] text-bone">
            Projects
          </h1>
          <p className="mt-6 max-w-prose text-[0.98rem] leading-relaxed text-bone-dim">
            Sculpture and gold-leaf works made between 2022 and 2025 — an ongoing
            field of the unborn, sewn from rags, ash and brass.
          </p>
        </Reveal>

        {/* Year filter */}
        <Reveal delay={0.1} className="mt-14 border-y border-line-soft">
          <div
            className="no-scrollbar -mx-[var(--gutter)] flex gap-1 overflow-x-auto px-[var(--gutter)] py-4 sm:mx-0 sm:px-0"
            role="tablist"
            aria-label="Filter projects by year"
          >
            {FILTERS.map((f) => {
              const isActive = active === f.value
              return (
                <button
                  key={f.label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(f.value)}
                  className={[
                    'shrink-0 rounded-full px-5 py-2 text-[0.7rem] uppercase tracking-[0.22em] transition-colors duration-500 ease-out-expo focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60',
                    isActive
                      ? 'text-gold-bright'
                      : 'text-muted hover:text-bone',
                  ].join(' ')}
                >
                  {f.label}
                  <span
                    aria-hidden
                    className={[
                      'ml-2 align-middle text-[0.6rem] tabular-nums',
                      isActive ? 'text-gold/70' : 'text-faint',
                    ].join(' ')}
                  >
                    {(f.value ? projectsByYear(f.value) : projects).length}
                  </span>
                </button>
              )
            })}
          </div>
        </Reveal>

        {/* Grid — keyed on `active` so reveals re-run with a soft transition on filter. */}
        <ul
          key={active ?? 'all'}
          className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20"
        >
          {shown.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </ul>
      </section>
    </>
  )
}
