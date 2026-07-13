/**
 * Backwards-compatible import for older call sites.
 * New carousel work belongs in the shared interaction package.
 */
export {
  useGestureCarousel as useHomeScroll,
  type GestureCarouselApi as HomeScrollApi,
} from '@/lib/useGestureCarousel'
export type { GestureCarouselOverrides as HomeScrollOptions } from '@/lib/gesture-carousel'
