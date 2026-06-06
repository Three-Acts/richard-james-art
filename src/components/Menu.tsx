import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { nav, site } from '@/data/site'
import { getLenis } from '@/lib/useLenis'

export interface MenuProps {
  open: boolean
  onClose: () => void
}

/**
 * Full-screen overlay menu. Big Cinzel nav links stagger in over a near-black
 * curtain, with contact + location anchored to the foot. Locks scroll while
 * open (Lenis + body), traps focus loosely, closes on Esc / link click / route
 * change. Accessible: role="dialog", aria-modal, labelled links.
 */
export default function Menu({ open, onClose }: MenuProps) {
  const location = useLocation()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const lastFocused = useRef<HTMLElement | null>(null)

  // Close on route change.
  useEffect(() => {
    if (open) onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Scroll lock + Esc + focus management while open.
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (!open) return

    lastFocused.current = document.activeElement as HTMLElement | null

    const lenis = getLenis()
    lenis?.stop()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Move focus into the overlay.
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      // Loose focus trap: keep focus within the panel.
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      getLenis()?.start()
      lastFocused.current?.focus?.()
    }
  }, [open, onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      className="fixed inset-0 z-[80]"
      style={{
        pointerEvents: open ? 'auto' : 'none',
        visibility: open ? 'visible' : 'hidden',
        transition: 'visibility 0s linear ' + (open ? '0s' : '0.7s'),
      }}
    >
      {/* Curtain */}
      <div
        className="absolute inset-0 bg-ink"
        onClick={onClose}
        style={{
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0)' : 'translateY(-2%)',
          transition:
            'opacity 0.7s var(--ease-in-out-quint), transform 0.8s var(--ease-in-out-quint)',
        }}
      />

      <div
        ref={panelRef}
        className="u-container relative flex h-full flex-col justify-between py-[var(--nav-h)]"
      >
        {/* Top row: eyebrow + close */}
        <div className="flex items-center justify-between" style={{ minHeight: 'var(--nav-h)' }}>
          <span
            className="u-eyebrow"
            style={{
              opacity: open ? 1 : 0,
              transition: 'opacity 0.6s var(--ease-out-expo) 0.2s',
            }}
          >
            Menu
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="u-eyebrow text-bone-dim transition-colors duration-500 hover:text-gold-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
            style={{
              opacity: open ? 1 : 0,
              transition: 'opacity 0.6s var(--ease-out-expo) 0.2s, color 0.5s var(--ease-out-expo)',
            }}
          >
            Close
          </button>
        </div>

        {/* Primary navigation */}
        <nav aria-label="Primary" className="flex-1">
          <ul className="flex h-full flex-col justify-center gap-2 sm:gap-3">
            {nav.map((item, i) => (
              <li key={item.href} className="overflow-hidden">
                <Link
                  to={item.href}
                  onClick={onClose}
                  className="group inline-flex items-baseline gap-4 text-bone transition-colors duration-500 hover:text-gold-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-gold"
                  style={{
                    transform: open ? 'translateY(0)' : 'translateY(110%)',
                    opacity: open ? 1 : 0,
                    transition: `transform 0.9s var(--ease-out-expo) ${
                      open ? 0.18 + i * 0.07 : 0
                    }s, opacity 0.9s var(--ease-out-expo) ${open ? 0.18 + i * 0.07 : 0}s, color 0.5s var(--ease-out-expo)`,
                  }}
                >
                  <span
                    className="u-eyebrow text-faint transition-colors duration-500 group-hover:text-gold"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="u-display text-[clamp(2.4rem,9vw,6rem)] leading-[0.95]">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer: contact + location */}
        <div
          className="flex flex-col gap-6 border-t border-line-soft pt-8 md:flex-row md:items-end md:justify-between"
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(1rem)',
            transition:
              'opacity 0.7s var(--ease-out-expo) 0.55s, transform 0.7s var(--ease-out-expo) 0.55s',
          }}
        >
          <div className="flex flex-col gap-1">
            <span className="u-eyebrow">Contact</span>
            <a
              href={`mailto:${site.email}`}
              className="link-underline font-body text-bone-dim transition-colors duration-500 hover:text-bone"
            >
              {site.email}
            </a>
            <a
              href={site.phoneHref}
              className="link-underline font-body text-bone-dim transition-colors duration-500 hover:text-bone"
            >
              {site.phone}
            </a>
          </div>
          <div className="flex flex-col gap-1 md:text-right">
            <span className="u-eyebrow">Based in</span>
            <span className="font-body text-bone-dim">{site.location}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
