/**
 * Central GSAP entry. Import { gsap, ScrollTrigger } from here so the plugin
 * is registered exactly once, and never on the server (SSG renders without it).
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

let registered = false

export function registerGsap(): void {
  if (typeof window === 'undefined' || registered) return
  gsap.registerPlugin(ScrollTrigger)
  registered = true
}

// Register eagerly on the client at import time.
registerGsap()

export { gsap, ScrollTrigger }
