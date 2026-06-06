import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useSmoothScroll, getLenis } from '@/lib/useLenis'
import { ScrollTrigger } from '@/lib/gsap'
import Nav from './Nav'
import Footer from './Footer'
import Preloader from './Preloader'

/**
 * App shell: smooth scroll, fixed navigation, the once-per-session preloader,
 * routed page content and the footer. Rendered for every route.
 */
export default function Layout() {
  const location = useLocation()

  // One shared Lenis instance wired to the GSAP ticker for the whole app.
  useSmoothScroll()

  // On route change, jump to top and let ScrollTrigger recompute.
  useEffect(() => {
    const lenis = getLenis()
    lenis?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
    ScrollTrigger.refresh()
  }, [location.pathname])

  const isHome = location.pathname === '/'

  return (
    <>
      <Preloader />
      <Nav transparent={isHome} />
      {/* `isolate` keeps the page's own stacking context (the home stage stacks
          its heroes / vignette / title plate as high as z-130) contained, so it
          can never paint over the fixed Nav (z-70), Menu (z-80) or Preloader
          (z-100). Without it those internal z-indices escape to the root and the
          art covers the open menu / hides the intro. */}
      <main id="main" className="isolate">
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </>
  )
}
