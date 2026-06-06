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
      <main id="main">
        <Outlet />
      </main>
      {!isHome && <Footer />}
    </>
  )
}
