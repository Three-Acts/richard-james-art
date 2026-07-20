import { useEffect, useRef } from 'react'
import type { Project } from '@/types'
import Image from '@/components/ui/Image'
import { gsap, ScrollTrigger } from '@/lib/gsap'

interface HeroProps {
  project: Project
  /** 1-based position in the full project sequence (for the index eyebrow). */
  index: number
  total: number
}

/**
 * Tall, full-bleed cinematic hero. The artwork bleeds edge-to-edge behind a
 * vertical scrim so the fixed nav and the overlaid title stay legible. The
 * image drifts slowly on scroll (parallax) and the title rises on entrance.
 *
 * SSR-safe: all motion lives in a guarded effect; the markup (image + title)
 * is fully present and visible without JS.
 */
export default function Hero({ project, index, total }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const image = imageRef.current
    const title = titleRef.current
    if (!section || !image || !title) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(title.children, { opacity: 1, y: 0 })
        return
      }

      // Slow, balanced entrance for the overlaid title lines.
      gsap.from(title.children, {
        opacity: 0,
        y: 40,
        duration: 1.4,
        ease: 'expo.out',
        stagger: 0.12,
        delay: 0.15,
      })

      // Subtle parallax: the image scales slightly and drifts as we scroll past.
      gsap.fromTo(
        image,
        { yPercent: -8, scale: 1.08 },
        {
          yPercent: 8,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    }, section)

    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [project.slug])

  return (
    <section
      ref={sectionRef}
      className="relative isolate flex min-h-[88svh] w-full items-end overflow-hidden bg-ink-soft"
    >
      {/* Artwork — slightly over-scaled so parallax never reveals an edge. */}
      <div ref={imageRef} className="u-fill will-change-transform">
        <Image
          src={project.hero}
          alt={project.title}
          priority
          sizes="100vw"
          className="h-full w-full"
        />
      </div>

      {/* Scrim: darken top (under nav) and bottom (under title) for legibility. */}
      <div
        aria-hidden
        className="u-fill bg-gradient-to-b from-ink/70 via-ink/10 to-ink/85"
      />
      <div
        aria-hidden
        className="u-fill bg-gradient-to-t from-ink via-transparent to-transparent"
      />

      <div className="u-container relative z-10 pb-[clamp(2.5rem,7vh,6rem)] pt-[var(--nav-h)]">
        <div ref={titleRef} className="max-w-[60rem]">
          <p className="u-eyebrow text-bone-dim">
            <span className="text-gold">
              {String(index).padStart(2, '0')}
            </span>
            <span className="mx-3 text-faint">/</span>
            <span>{String(total).padStart(2, '0')}</span>
          </p>

          <h1 className="u-display mt-5 text-balance text-[clamp(2.4rem,7vw,6rem)] leading-[0.98] text-bone">
            {project.title}
          </h1>

          {project.subtitle && (
            <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 font-body text-[clamp(1rem,2vw,1.35rem)] text-bone-dim">
              {project.originalTitle && (
                <bdi
                  lang={project.originalTitleLang}
                  dir="auto"
                  className="text-[1.12em] text-gold-bright"
                >
                  {project.originalTitle}
                </bdi>
              )}
              <span>{project.subtitle}</span>
            </p>
          )}

          <p className="mt-5 flex items-center gap-4 font-body text-sm text-bone-dim">
            <span className="u-display tracking-[0.22em] text-gold-bright">
              {project.year}
            </span>
            <span aria-hidden className="h-px w-10 bg-line" />
            <span className="max-w-[28rem] truncate text-muted">
              {project.medium}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
