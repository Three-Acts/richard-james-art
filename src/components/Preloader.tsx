import { useEffect, useRef, useState } from 'react'
import { site } from '@/data/site'
import { getLenis } from '@/lib/useLenis'

const SESSION_KEY = 'rj-preloaded'

/**
 * Once-per-session cinematic intro: the wordmark settles in over near-black, a
 * hairline progress line draws to 100, then the whole curtain lifts away to
 * reveal the site. Locks scroll while active; releases and goes
 * pointer-events:none when finished. Reduced motion => brief fade.
 *
 * SSR-safe: the overlay markup renders on the server (harmless), but the
 * session check + animation run only on the client. After the first visit in a
 * session it renders nothing.
 */
export default function Preloader() {
  // Assume "show" on the server / first client paint; the effect decides for real.
  const [active, setActive] = useState(true)
  const [done, setDone] = useState(false)
  const [progress, setProgress] = useState(0)
  const [enter, setEnter] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already shown this session — skip entirely.
    let alreadyShown = false
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      alreadyShown = false
    }
    if (alreadyShown) {
      setActive(false)
      return
    }

    const finish = () => {
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* sessionStorage may be unavailable (private mode) — non-fatal. */
      }
      getLenis()?.start()
      setDone(true)
      // Remove from the tree after the lift transition completes.
      window.setTimeout(() => setActive(false), 1100)
    }

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Lock scroll for the duration of the intro.
    getLenis()?.stop()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Trigger the entrance on the next frame so transitions run.
    const enterTimer = window.setTimeout(() => setEnter(true), 30)

    if (reduce) {
      setProgress(100)
      const t = window.setTimeout(finish, 450)
      return () => {
        window.clearTimeout(enterTimer)
        window.clearTimeout(t)
        document.body.style.overflow = prevOverflow
        getLenis()?.start()
      }
    }

    // Animate the counter / progress line over ~1.7s with an eased curve.
    const start = performance.now()
    const DURATION = 1700

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      // ease-out-expo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
      setProgress(Math.round(eased * 100))
      if (t < 1) {
        rafRef.current = window.requestAnimationFrame(tick)
      } else {
        window.setTimeout(finish, 320)
      }
    }
    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      window.clearTimeout(enterTimer)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      document.body.style.overflow = prevOverflow
      getLenis()?.start()
    }
  }, [])

  if (!active) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
      style={{
        transform: done ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 1s var(--ease-in-out-quint)',
        pointerEvents: done ? 'none' : 'auto',
      }}
    >
      <div
        className="flex flex-col items-center gap-7 px-[var(--gutter)] text-center"
        style={{
          opacity: done ? 0 : 1,
          transition: 'opacity 0.5s var(--ease-out-expo)',
        }}
      >
        <span
          className="u-eyebrow"
          style={{
            opacity: enter ? 1 : 0,
            transition: 'opacity 0.8s var(--ease-out-expo) 0.1s',
          }}
        >
          {site.location}
        </span>

        <h1
          className="u-display text-bone text-[clamp(2rem,7vw,4.5rem)] leading-none"
          style={{
            opacity: enter ? 1 : 0,
            transform: enter ? 'translateY(0)' : 'translateY(0.6rem)',
            transition:
              'opacity 1s var(--ease-out-expo) 0.15s, transform 1.1s var(--ease-out-expo) 0.15s',
          }}
        >
          {site.name}
        </h1>

        {/* Progress line + counter */}
        <div className="mt-2 flex w-[min(18rem,60vw)] flex-col items-center gap-3">
          <div className="relative h-px w-full overflow-hidden bg-line-soft">
            <span
              className="absolute inset-y-0 left-0 block bg-gold"
              style={{
                width: `${progress}%`,
                transition: 'width 0.15s linear',
              }}
            />
          </div>
          <span
            className="u-eyebrow tabular-nums text-faint"
            style={{
              opacity: enter ? 1 : 0,
              transition: 'opacity 0.8s var(--ease-out-expo) 0.2s',
            }}
          >
            {String(progress).padStart(3, '0')}
          </span>
        </div>
      </div>
    </div>
  )
}
