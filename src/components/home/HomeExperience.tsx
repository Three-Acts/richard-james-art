import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Image from '@/components/ui/Image'
import { projects, years } from '@/data/projects'
import { useGestureCarousel } from '@/lib/useGestureCarousel'
import CenterStage from './CenterStage'
import VerticalTrack, { MobileTrack } from './VerticalTrack'
import TitlePlate from './TitlePlate'
import YearFilter from './YearFilter'

/**
 * The signature home experience.
 *
 * Desktop (md+): a fixed full-viewport cinematic stage that SNAPS between works.
 * A wheel flick, a vertical drag (anywhere — stage or rail), or the arrow keys
 * move a continuous position that commits to the next/previous work past a
 * threshold, else eases back (see useGestureCarousel). The cross-fade and rail
 * translate are driven imperatively from that position; the rounded active
 * index updates title / year / aria.
 *
 * Mobile (< md): a calmer stacked layout — a full-width hero near the top, the
 * title plate beneath, a horizontal scroll-snap thumbnail strip, and a year
 * chip row. Active is set by an IntersectionObserver on the strip.
 *
 * SSR / no-JS: the first project's hero, title and meta are present in the
 * markup (CenterStage + TitlePlate render from props), so the page is never
 * blank. The fancy mechanic only enhances on the client.
 */
export default function HomeExperience() {
  const N = projects.length
  const api = useGestureCarousel(N)
  const { activeIndex, stageRef } = api
  const active = projects[activeIndex] ?? projects[0]

  // Mobile gets its own active index (IO-driven), independent of scroll trigger.
  const [mobileIndex, setMobileIndex] = useState(0)
  const mobileActive = projects[mobileIndex] ?? projects[0]

  return (
    <div className="bg-ink text-bone">
      {/* ============================ DESKTOP ============================ */}
      {/* A fixed full-viewport stage. Wheel / vertical drag / arrows step
          between works (snap); the page itself doesn't scroll. */}
      <div className="hidden md:block">
        <div
          ref={stageRef}
          data-lenis-prevent
          data-gesture-carousel
          className="relative h-[100svh] w-full cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
          style={{ paddingTop: 'var(--nav-h)' }}
          role="group"
          aria-roledescription="carousel"
          aria-label="Selected works — scroll, drag or use arrow keys"
        >
          <CenterStage projects={projects} activeIndex={activeIndex} api={api} />
          <VerticalTrack projects={projects} activeIndex={activeIndex} api={api} />
          <YearFilter
            projects={projects}
            years={years}
            activeIndex={activeIndex}
            goToIndex={api.goToIndex}
          />
          <TitlePlate
            project={active}
            index={activeIndex}
            total={N}
            reducedMotion={api.reducedMotion}
          />

          {/* affordance, fades after the first work */}
          <ScrollHint progressApi={api} />
        </div>
      </div>

      {/* ============================ MOBILE ============================= */}
      <div className="md:hidden">
        <MobileHome
          activeIndex={mobileIndex}
          setActiveIndex={setMobileIndex}
          active={mobileActive}
        />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- */

function ScrollHint({
  progressApi,
}: {
  progressApi: ReturnType<typeof useGestureCarousel>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { reducedMotion, registerFrame } = progressApi
  useEffect(() => {
    if (reducedMotion) return
    const unsub = registerFrame((p) => {
      const el = ref.current
      if (!el) return
      // visible only at the very start
      el.style.opacity = String(Math.max(0, 1 - p * 14))
    })
    return unsub
  }, [reducedMotion, registerFrame])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute bottom-[clamp(1.5rem,5vh,3rem)] left-1/2 z-30 -translate-x-1/2 flex-col items-center gap-2 hidden lg:flex"
    >
      <span className="u-eyebrow text-[0.6rem] text-faint">Scroll · Drag</span>
      <span className="block h-10 w-px bg-gradient-to-b from-gold/60 to-transparent" />
    </div>
  )
}

/* --------------------------------------------------------------------- */

function MobileHome({
  activeIndex,
  setActiveIndex,
  active,
}: {
  activeIndex: number
  setActiveIndex: (i: number) => void
  active: (typeof projects)[number]
}) {
  return (
    <section className="flex min-h-screen flex-col" style={{ paddingTop: 'var(--nav-h)' }}>
      {/* Full-width hero near the top. */}
      <div className="relative w-full px-[var(--gutter)] pt-4">
        <Link
          to={`/projects/${active.slug}`}
          aria-label={`View ${active.title}`}
          className="block"
        >
          <Image
            src={active.hero}
            alt={active.title}
            priority
            aspectRatio="3/4"
            sizes="100vw"
            className="w-full rounded-[2px] object-cover"
          />
        </Link>
      </div>

      {/* Title plate. */}
      <div className="px-[var(--gutter)] pt-6">
        <div className="mb-3 flex items-center gap-3">
          <span className="u-eyebrow text-gold">
            {String(activeIndex + 1).padStart(2, '0')}
            <span className="text-faint"> / {String(projects.length).padStart(2, '0')}</span>
          </span>
          <span aria-hidden="true" className="h-px w-8 bg-line" />
        </div>
        <h2 className="overflow-hidden">
          <Link
            to={`/projects/${active.slug}`}
            className="u-display link-underline inline-block text-[clamp(1.6rem,7vw,2.4rem)] leading-[1.04] text-bone"
          >
            {active.title}
          </Link>
        </h2>
        <div className="mt-5">
          <Link to={`/projects/${active.slug}`} className="btn-line">
            View Details
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {/* Thumbnail strip. */}
      <div className="mt-7 border-t border-line-soft pt-4">
        <MobileTrack
          projects={projects}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      </div>

      {/* Year chips. */}
      <div className="mt-4 px-[var(--gutter)] pb-10">
        <YearFilter
          projects={projects}
          years={years}
          activeIndex={activeIndex}
          goToIndex={setActiveIndex}
          variant="chips"
        />
      </div>
    </section>
  )
}
