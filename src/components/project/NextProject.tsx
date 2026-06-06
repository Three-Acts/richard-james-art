import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '@/types'
import Image from '@/components/ui/Image'
import { gsap, ScrollTrigger } from '@/lib/gsap'

interface NextProjectProps {
  next: Project
}

/**
 * Full-width closing section linking to the next work. A peek of the next
 * project's hero sits behind a scrim; the title in large Cinzel acts as the
 * link, with a strong gold/scale hover. The whole panel is one anchor for a
 * generous target. SSR-safe: content is present without JS; motion only
 * enhances and respects reduced motion.
 */
export default function NextProject({ next }: NextProjectProps) {
  const rootRef = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const image = imageRef.current
    const title = titleRef.current
    if (!root || !image || !title) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(title, { opacity: 1, y: 0 })
        return
      }

      gsap.from(title, {
        opacity: 0,
        y: 48,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: root, start: 'top 78%' },
      })

      // Slow parallax drift on the background peek as it enters.
      gsap.fromTo(
        image,
        { yPercent: -10 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: root,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    }, root)

    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [next.slug])

  return (
    <section ref={rootRef} className="relative w-full border-t border-line-soft">
      <Link
        to={`/projects/${next.slug}`}
        aria-label={`Next project — ${next.title}`}
        className="group relative isolate flex min-h-[60svh] items-center overflow-hidden bg-ink-soft py-[clamp(4rem,12vh,9rem)]"
      >
        {/* Hero peek */}
        <div
          ref={imageRef}
          className="u-fill scale-[1.12] opacity-40 transition-[opacity,transform] duration-[1.2s] ease-out-expo will-change-transform group-hover:scale-[1.18] group-hover:opacity-60"
        >
          <Image
            src={next.hero}
            alt=""
            sizes="100vw"
            className="h-full w-full"
            draggable={false}
          />
        </div>

        {/* Scrims for legibility */}
        <div
          aria-hidden
          className="u-fill bg-gradient-to-r from-ink via-ink/70 to-ink/30"
        />
        <div
          aria-hidden
          className="u-fill bg-gradient-to-t from-ink via-transparent to-ink/40"
        />

        <div className="u-container relative z-10">
          <p className="u-eyebrow text-gold">Next Project</p>

          <h2
            ref={titleRef}
            className="u-display mt-5 max-w-[20ch] text-balance text-[clamp(2rem,6.5vw,5.5rem)] leading-[0.98] text-bone transition-colors duration-500 ease-out-expo group-hover:text-gold-bright"
          >
            {next.title}
          </h2>

          <span className="mt-8 inline-flex items-center gap-3 font-body text-xs uppercase tracking-[0.24em] text-bone-dim transition-colors duration-500 ease-out-expo group-hover:text-bone">
            <span>{next.year}</span>
            <span
              aria-hidden
              className="inline-block h-px w-10 origin-left bg-line transition-[width,background-color] duration-500 ease-out-expo group-hover:w-16 group-hover:bg-gold"
            />
            <span>View</span>
          </span>
        </div>
      </Link>
    </section>
  )
}
