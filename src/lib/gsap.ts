/**
 * Central GSAP entry. Import { gsap, ... } from here so plugins are
 * registered exactly once, and never on the server (SSG renders without it).
 *
 * Observer, Draggable and InertiaPlugin power the carousel input layer
 * (see src/lib/carousel). All three ship free in the public gsap package
 * since 3.13.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Observer } from 'gsap/Observer'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

let registered = false

export function registerGsap(): void {
  if (typeof window === 'undefined' || registered) return
  gsap.registerPlugin(ScrollTrigger, Observer, Draggable, InertiaPlugin)
  registered = true
}

// Register eagerly on the client at import time.
registerGsap()

export { gsap, ScrollTrigger, Observer, Draggable, InertiaPlugin }
