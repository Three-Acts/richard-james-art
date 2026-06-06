import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

/**
 * A single shared Lenis instance, created on the client and synced with the
 * GSAP ticker so ScrollTrigger and Lenis share one RAF loop. SSG-safe: the
 * effect only runs in the browser.
 */
let lenis: Lenis | null = null

export function getLenis(): Lenis | null {
  return lenis
}

export interface SmoothScrollOptions {
  /** When false, native scrolling is used (e.g. if you ever need to opt out). */
  enabled?: boolean
}

/**
 * Mount once near the root (see Layout). Initialises Lenis, wires it to the
 * GSAP ticker + ScrollTrigger, and tears down on unmount.
 */
export function useSmoothScroll({ enabled = true }: SmoothScrollOptions = {}): void {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const instance = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      // Touch devices keep native momentum scrolling.
      syncTouch: false,
    })
    lenis = instance

    instance.on('scroll', ScrollTrigger.update)

    const onTick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(onTick)
      instance.destroy()
      if (lenis === instance) lenis = null
    }
  }, [enabled])
}
