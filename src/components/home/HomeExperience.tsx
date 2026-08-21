import { memo, useEffect, useRef, useState, type ReactNode } from 'react'
import Image from '@/components/ui/Image'
import { projects, years } from '@/data/projects'
import { getLenis } from '@/lib/lenis'
import { initScrollSync } from '@/lib/scrollSync'
import { useCarousel } from '@/lib/carousel/useCarousel'
import CenterStage from './CenterStage'
import ProjectsGrid from './ProjectsGrid'
import VerticalTrack, { MobileTrack } from './VerticalTrack'
import TitlePlate from './TitlePlate'
import YearFilter from './YearFilter'

/**
 * The signature home experience, in one of two visitor-switchable displays.
 *
 * The chrome is shared and stays put across a swap: on desktop the left year
 * rail (with the display toggle docked beneath it) and on mobile the toggle
 * floating at the foot of the viewport. Only the CONTENT — the hero images,
 * the thumbnail rail and the title — cross-fades: the outgoing content
 * dissolves out and the incoming one dissolves in through one PERSISTENT
 * wrapper (which is why the dissolve stays buttery — the element never
 * unmounts mid-transition). The year rail and toggle live OUTSIDE that
 * wrapper, so the years on the left never flicker while you switch.
 *
 * Because the rail sits outside the displays, each display reports its active
 * work + navigator up (onNav) so the one rail can light the right year and
 * jump on click for whichever display is on screen.
 *
 * "Slideshow" (default, and what SSR ships): the cinematic stage.
 *  - Desktop (md+): a fixed full-viewport stage that SNAPS between works.
 *    A wheel flick, a vertical drag or the arrow keys move a continuous
 *    position that commits to the next/previous work past a threshold. The
 *    cross-fade and rail translate are driven imperatively from that position.
 *  - Mobile (< md): a calmer single-screen layout — the whole artwork (a link
 *    to its page), its title + counter, and a horizontal thumbnail strip.
 *
 * "Grid": every work as a normally-scrolling grid (see ProjectsGrid), with the
 *  same year rail navigating it.
 *
 * The choice persists for the session. SSR / no-JS: the first project's hero,
 * title and meta are present in the markup, so the page is never blank.
 */

type HomeView = 'stage' | 'grid'
const VIEW_KEY = 'home-view'
// Fade-out wait before the swap; the CSS transition runs slightly faster so
// the outgoing content has fully vanished when the incoming one mounts.
const FADE_MS = 300

/** Active work + how to jump to one, reported up by the on-screen display so
 *  the persistent (outside-the-fade) year rail can drive whichever is shown. */
export interface HomeNav {
  activeIndex: number
  goToIndex: (index: number) => void
}

export default function HomeExperience() {
  // `view` is the chosen display (drives the toggle + persistence);
  // `shown` is the one currently rendered — it lags by one fade-out.
  const [view, setView] = useState<HomeView>('stage')
  const [shown, setShown] = useState<HomeView>('stage')
  const [fading, setFading] = useState(false)
  // The active work + navigator of whichever display is on screen, feeding the
  // persistent year rail. Default lights the newest year for SSR / first paint.
  const [nav, setNav] = useState<HomeNav>({ activeIndex: 0, goToIndex: () => { } })
  const fadeTimer = useRef<number | undefined>(undefined)

  // The stage runs on the GSAP ticker, so put Lenis on the same frame — the
  // shell leaves it on a standalone RAF for the pages that never load GSAP.
  useEffect(() => {
    initScrollSync()
  }, [])

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
      {/* Content cross-fades through this ONE persistent wrapper — unmounting
          the view each swap would kill the buttery dissolve. The year rail and
          toggles sit OUTSIDE it, so the years never flicker as you switch. */}
      <div
        className="transition-opacity duration-[280ms] ease-out"
        style={{
          opacity: fading ? 0 : 1,
          pointerEvents: fading ? 'none' : undefined,
        }}
      >
        {shown === 'grid' ? (
          <GridHome onNav={setNav} />
        ) : (
          <StageHome onNav={setNav} />
        )}
      </div>

      {/* Desktop: the year rail holds steady through every swap, the display
          toggle docked beneath the year list. Hidden below md. */}
      <YearFilter
        projects={projects}
        years={years}
        activeIndex={nav.activeIndex}
        goToIndex={nav.goToIndex}
        position="fixed"
        footer={<ViewToggle view={view} onViewChange={changeView} />}
      />

      {/* Mobile: the toggle floats at the foot of the viewport. */}
      <MobileViewToggle view={view} onViewChange={changeView} />
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

function ViewToggle({ view, onViewChange, className = '' }: { view: HomeView, onViewChange: (view: HomeView) => void, className?: string }) {
  const options: { value: HomeView; label: string; icon: ReactNode }[] = [
    { value: 'stage', label: 'Slideshow view', icon: <SlideshowIcon /> },
    { value: 'grid', label: 'Grid view', icon: <GridIcon /> },
  ]

  return (
    <div role="group" aria-label="Display works as" className={`pointer-events-auto inline-flex items-center gap-1 ${className}`} >
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

/** Mobile-only: the display toggle pinned to the foot of the viewport. The
 *  wrapper is click-through so it never steals gestures; only the pill is
 *  interactive. Sits below the nav / menu (z) but above the content. */
function MobileViewToggle({
  view,
  onViewChange,
}: {
  view: HomeView
  onViewChange: (view: HomeView) => void
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center md:hidden"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <ViewToggle view={view} onViewChange={onViewChange} />
    </div>
  )
}

/* --------------------------------------------------------------------- */

/** The grid display. The year rail lives at the top level now, so this is just
 *  the grid; it reports its active work + navigator up via onNav. */
const GridHome = memo(function GridHome({
  onNav,
}: {
  onNav: (nav: HomeNav) => void
}) {
  return (
    <div style={{ paddingTop: 'var(--nav-h)' }}>
      <ProjectsGrid onNav={onNav} />
    </div>
  )
})

/* --------------------------------------------------------------------- */

/** The cinematic slideshow display (desktop stage + mobile stack). Memoised so
 *  a rail update (parent re-render) doesn't re-reconcile the 40-slide stage —
 *  it only re-renders on its own active-index change. */
const StageHome = memo(function StageHome({
  onNav,
}: {
  onNav: (nav: HomeNav) => void
}) {
  const N = projects.length
  const api = useCarousel(N)
  const { activeIndex, stageRef } = api
  const active = projects[activeIndex] ?? projects[0]

  // Mobile gets its own active index (IO-driven), independent of scroll trigger.
  const [mobileIndex, setMobileIndex] = useState(0)
  const mobileActive = projects[mobileIndex] ?? projects[0]

  // Feed the persistent year rail: the desktop stage owns the rail's active
  // year + jump target (the rail is hidden on mobile).
  useEffect(() => {
    onNav({ activeIndex, goToIndex: api.goToIndex })
  }, [activeIndex, api.goToIndex, onNav])

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
    </>
  )
})

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

/**
 * Mobile slideshow: pared back to fit one screen (nothing pushed below the
 * fold). Just the artwork, its title + counter, and the thumbnail track — the
 * whole artwork is the link to its page, so there's no separate "View Details"
 * button, and the year chips are gone. The hero flexes to fill whatever height
 * is left and shows the WHOLE work (contain), never cropped. Room is left at
 * the foot for the floating display toggle.
 */
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
    <section
      className="flex h-[100svh] flex-col overflow-hidden"
      style={{ paddingTop: 'var(--nav-h)' }}
    >
      {/* Hero — fills the space left over, whole artwork visible, tappable. */}
      <div className="relative min-h-0 flex-1 px-[var(--gutter)] pt-3">
        <a
          href={`/projects/${active.slug}`}
          aria-label={`View ${active.title}`}
          className="block h-full"
        >
          <Image
            src={active.hero}
            alt={active.title}
            priority
            sizes="100vw"
            className="h-full w-full [&>img]:!object-contain"
          />
        </a>
      </div>

      {/* Title + counter (no CTA — the artwork above is the link). */}
      <div className="shrink-0 px-[var(--gutter)] pt-4">
        <div className="mb-2.5 flex items-center gap-3">
          <span className="u-eyebrow text-gold">
            {String(activeIndex + 1).padStart(2, '0')}
            <span className="text-faint"> / {String(projects.length).padStart(2, '0')}</span>
          </span>
          <span aria-hidden="true" className="h-px w-8 bg-line" />
        </div>
        <h2 className="overflow-hidden">
          <a
            href={`/projects/${active.slug}`}
            className="u-display link-underline inline-block text-[clamp(1.5rem,6.5vw,2.2rem)] leading-[1.04] text-bone"
          >
            {active.title}
          </a>
        </h2>
      </div>

      {/* Thumbnail track, clear of the floating toggle beneath it. */}
      <div
        className="mt-4 shrink-0 border-t border-line-soft pt-3"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
      >
        <MobileTrack
          projects={projects}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      </div>
    </section>
  )
}
