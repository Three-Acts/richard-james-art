import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { nav, site } from '@/data/site'
import Menu from './Menu'

/**
 * Fixed top navigation. Over the home hero it sits transparent on the art;
 * elsewhere — and on home once you scroll past the first viewport — a subtle
 * ink wash + backdrop blur with a hairline base appears. Hides on scroll-down,
 * reveals on scroll-up. Owns the full-screen Menu's open state.
 */
export default function Nav({ transparent = false }: { transparent?: boolean }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  // Scroll state: solid background past a threshold + hide/show direction.
  useEffect(() => {
    if (typeof window === 'undefined') return

    lastY.current = window.scrollY
    let ticking = false

    const update = () => {
      ticking = false
      const y = window.scrollY
      setScrolled(y > 24)

      // Don't hide while the menu is open or near the very top.
      if (!menuOpen) {
        const delta = y - lastY.current
        if (y > 160 && delta > 6) setHidden(true)
        else if (delta < -6 || y < 160) setHidden(false)
      }
      lastY.current = y
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [menuOpen])

  // The bar gets a background when scrolled, or always on non-transparent pages.
  const solid = !transparent || scrolled

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-[70]"
        style={{
          transform: hidden && !menuOpen ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.6s var(--ease-out-expo)',
        }}
      >
        {/* Background wash — fades in independently so type never flickers. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 border-b border-line-soft bg-ink/70 backdrop-blur-md"
          style={{
            opacity: solid && !menuOpen ? 1 : 0,
            transition: 'opacity 0.6s var(--ease-out-expo)',
          }}
        />

        <nav
          aria-label="Main"
          className="u-container relative flex items-center justify-between"
          style={{ height: 'var(--nav-h)' }}
        >
          <Link
            to="/"
            className="u-display text-sm tracking-[0.22em] text-bone transition-colors duration-500 hover:text-gold-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            {site.name}
          </Link>

          {/* Desktop links + menu trigger */}
          <div className="hidden items-center gap-8 md:flex">
            <ul className="flex items-center gap-7">
              {nav.map((item) => {
                const active =
                  item.href === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`link-underline u-eyebrow transition-colors duration-500 hover:text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                        active ? 'text-gold' : ''
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <span aria-hidden="true" className="h-4 w-px bg-line" />

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              className="group flex items-center gap-3 text-bone transition-colors duration-500 hover:text-gold-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              <span className="u-eyebrow text-current">Menu</span>
              <span aria-hidden="true" className="flex flex-col gap-[5px]">
                <span className="block h-px w-5 bg-current" />
                <span className="block h-px w-5 bg-current" />
              </span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="flex h-10 w-10 -mr-2 items-center justify-end text-bone transition-colors duration-500 hover:text-gold-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-gold md:hidden"
          >
            <span aria-hidden="true" className="flex flex-col items-end gap-[6px]">
              <span className="block h-px w-6 bg-current" />
              <span className="block h-px w-4 bg-current" />
            </span>
          </button>
        </nav>
      </header>

      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}
