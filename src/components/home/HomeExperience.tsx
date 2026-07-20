import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Image from '@/components/ui/Image'
import { projects, years } from '@/data/projects'
import { getLenis } from '@/lib/useLenis'
import { useCarousel } from '@/lib/carousel/useCarousel'
import CenterStage from './CenterStage'
import ProjectsGrid from './ProjectsGrid'
import VerticalTrack, { MobileTrack } from './VerticalTrack'
import TitlePlate from './TitlePlate'
import YearFilter from './YearFilter'

/**
 * The signature home experience, in one of two visitor-switchable displays
 * that share their chrome — the display toggle (top right) and, on desktop,
 * the left year rail sit in the same place in both, so swapping shifts as
 * little as possible. The swap itself is a simple fade: the outgoing display
 * fades out, the incoming one fades in.
 *
 * "Slideshow" (default, and what SSR ships): the cinematic stage.
 *  - Desktop (md+): a fixed full-viewport stage that SNAPS between works.
 *    A wheel flick, a vertical drag (anywhere — stage or rail), or the arrow
 *    keys move a continuous position that commits to the next/previous work
 *    past a threshold, else eases back (see useGestureCarousel). The
 *    cross-fade and rail translate are driven imperatively from that
 *    position; the rounded active index updates title / year / aria.
 *  - Mobile (< md): a calmer stacked layout — a full-width hero near the top,
 *    the title plate beneath, a horizontal scroll-snap thumbnail strip, and a
 *    year chip row. Active is set by an IntersectionObserver on the strip.
 *
 * "Grid": every work as a normally-scrolling grid (see ProjectsGrid), with
 *  the same year rail navigating it.
 *
 * The choice persists for the session, so coming back from a detail page
 * lands on the same display. The stage subtree fully unmounts/remounts on
 * toggle — its gesture listeners bind on mount.
 *
 * SSR / no-JS: the first project's hero, title and meta are present in the
 * markup (CenterStage + TitlePlate render from props), so the page is never
 * blank. The fancy mechanic only enhances on the client.
 */

type HomeView = 'stage' | 'grid'
const VIEW_KEY = 'home-view'
// Fade-out wait before the swap; the CSS transition runs slightly faster so
// the outgoing display has fully vanished when the incoming one mounts.
const FADE_MS = 300

export default function HomeExperience() {
  // `view` is the chosen display (drives the toggle + persistence);
  // `shown` is the one currently rendered — it lags by one fade-out.
  const [view, setView] = useState<HomeView>('stage')
  const [shown, setShown] = useState<HomeView>('stage')
  const [fading, setFading] = useState(false)
  const fadeTimer = useRef<number | undefined>(undefined)

  // SSR always ships the slideshow; restore the visitor's choice only after
  // mount (without a fade) so hydration stays consistent.
  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(VIEW_KEY) === 'grid') {
        setView('grid')
        setShown('grid')
      }
    } catch {
      /* storage unavailable — keep the default */
    }
    return () => window.clearTimeout(fadeTimer.current)
  }, [])

  const changeView = (next: HomeView) => {
    if (next === view) return
    setView(next)
    try {
      window.sessionStorage.setItem(VIEW_KEY, next)
    } catch {
      /* storage unavailable — the toggle still works for this render */
    }

    const swap = () => {
      setShown(next)
      setFading(false)
      // The grid scrolls the document; the stage is a fixed viewport at the
      // top. Reset scroll so neither display appears somewhere mid-page.
      getLenis()?.scrollTo(0, { immediate: true })
      window.scrollTo(0, 0)
    }

    window.clearTimeout(fadeTimer.current)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      swap()
      return
    }
    setFading(true)
    fadeTimer.current = window.setTimeout(swap, FADE_MS)
  }

  return (
    <div className="bg-ink text-bone">
      {/* The displays cross-fade through this wrapper. On desktop the toggle
          docks under the year rail inside each display — identical spot in
          both, so it reads as staying put through the fade. */}
      <div
        className="transition-opacity duration-[280ms] ease-out"
        style={{
          opacity: fading ? 0 : 1,
          pointerEvents: fading ? 'none' : undefined,
        }}
      >
        {shown === 'grid' ? (
          <GridHome view={view} onViewChange={changeView} />
        ) : (
          <StageHome view={view} onViewChange={changeView} />
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- */

/** The slideshow glyph: a centre frame with the neighbouring slides peeking. */
function SlideshowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4.75" y="2.75" width="6.5" height="10.5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.75 5.5v5M14.25 5.5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

/** The grid glyph: four tiles. */
function GridIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.25" y="2.25" width="4.75" height="4.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="2.25" width="4.75" height="4.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="2.25" y="9" width="4.75" height="4.75" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="4.75" height="4.75" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function ViewToggle({
  view,
  onViewChange,
  className = '',
}: {
  view: HomeView
  onViewChange: (view: HomeView) => void
  className?: string
}) {
  const options: { value: HomeView; label: string; icon: ReactNode }[] = [
    { value: 'stage', label: 'Slideshow view', icon: <SlideshowIcon /> },
    { value: 'grid', label: 'Grid view', icon: <GridIcon /> },
  ]
  return (
    <div
      role="group"
      aria-label="Display works as"
      className={`pointer-events-auto inline-flex items-center gap-1 rounded-full border border-line-soft bg-ink/50 p-1 backdrop-blur-sm ${className}`}
    >
      {options.map((o) => {
        const isActive = view === o.value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={isActive}
            aria-label={o.label}
            title={o.label}
            onClick={() => onViewChange(o.value)}
            className={[
              'flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-500 ease-out-expo focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60',
              isActive ? 'bg-gold/10 text-gold-bright' : 'text-muted hover:text-bone',
            ].join(' ')}
          >
            {o.icon}
          </button>
        )
      })}
    </div>
  )
}

/* --------------------------------------------------------------------- */

/** The grid display. Desktop chrome (rail) lives inside ProjectsGrid; the
 *  mobile toggle row mirrors the slideshow's so the control doesn't move. */
function GridHome({
  view,
  onViewChange,
}: {
  view: HomeView
  onViewChange: (view: HomeView) => void
}) {
  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      <div className="flex justify-end px-[var(--gutter)] pt-3 md:hidden">
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
      <ProjectsGrid
        railFooter={<ViewToggle view={view} onViewChange={onViewChange} />}
      />
    </div>
  )
}

/* --------------------------------------------------------------------- */

/** The cinematic slideshow display (desktop stage + mobile stack). */
function StageHome({
  view,
  onViewChange,
}: {
  view: HomeView
  onViewChange: (view: HomeView) => void
}) {
  const N = projects.length
  const api = useCarousel(N)
  const { activeIndex, stageRef } = api
  const active = projects[activeIndex] ?? projects[0]

  // Mobile gets its own active index (IO-driven), independent of scroll trigger.
  const [mobileIndex, setMobileIndex] = useState(0)
  const mobileActive = projects[mobileIndex] ?? projects[0]

  return (
    <>
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
            footer={<ViewToggle view={view} onViewChange={onViewChange} />}
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
          toggle={<ViewToggle view={view} onViewChange={onViewChange} />}
        />
      </div>
    </>
  )
}

/* --------------------------------------------------------------------- */

function ScrollHint({
  progressApi,
}: {
  progressApi: ReturnType<typeof useCarousel>
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
  toggle,
}: {
  activeIndex: number
  setActiveIndex: (i: number) => void
  active: (typeof projects)[number]
  toggle: ReactNode
}) {
  return (
    <section className="flex min-h-screen flex-col" style={{ paddingTop: 'var(--nav-h)' }}>
      {/* Display toggle above the hero. */}
      <div className="flex justify-end px-[var(--gutter)] pt-3">{toggle}</div>

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
