import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'

/**
 * The engine behind the home experience — a GESTURE-STEP SNAP carousel.
 *
 * The home is a fixed full-viewport stage (no free page scroll). A wheel flick,
 * a vertical drag, the arrow keys, or a thumbnail/year click move a CONTINUOUS
 * `displayPos` (0..N-1) between whole-numbered works:
 *   - During a gesture you see a live preview toward the neighbour.
 *   - Cross the threshold and it COMMITS to the next/previous work; fall short
 *     and it EASES BACK to where it was. It never rests on a half-faded state.
 *
 * Consumers stay imperative — `registerFrame((progress01, index) => …)` streams
 * the animated position each frame so CenterStage / VerticalTrack drive their
 * transforms without re-rendering 25 images. `activeIndex` (rounded) feeds the
 * title / year / aria.
 *
 * SSR-safe: nothing touches window/gsap until the effect runs in the browser;
 * with JS off, Home.tsx's static fallback is what crawlers see.
 */

type FrameCb = (progress: number, index: number) => void

export interface HomeScrollApi {
  /** Attach to the full-viewport stage; the engine binds wheel + drag here. */
  stageRef: React.RefObject<HTMLDivElement>
  activeIndex: number
  setActiveIndex: (i: number) => void
  /** Continuous position as 0..1 (displayPos / lastN). */
  progressRef: React.MutableRefObject<number>
  registerFrame: (cb: FrameCb) => () => void
  /** Animate to a whole work (thumb / year / keyboard). */
  goToIndex: (i: number, opts?: { immediate?: boolean }) => void
  ready: boolean
  reducedMotion: boolean
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// Tuning — feel of the snap.
const WHEEL_SPAN = 130 // px of wheel delta to preview one whole step
const WHEEL_SETTLE_MS = 110 // quiet time before a wheel gesture commits
const DRAG_SPAN = 88 // px of drag to move one step (smaller = easier)
const DRAG_ENGAGE_PX = 6 // movement before a press becomes a drag (vs a click)
const FLICK_V = 2.4 // index-units/sec that counts as a directional flick
const TWEEN_DUR = 0.62

export function useHomeScroll(count: number): HomeScrollApi {
  const stageRef = useRef<HTMLDivElement>(null)

  const progressRef = useRef(0)
  const displayPosRef = useRef(0) // continuous 0..lastN
  const committedRef = useRef(0) // last whole work landed on
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndexState] = useState(0)
  const [ready, setReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const framesRef = useRef<Set<FrameCb>>(new Set())
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  const lastN = Math.max(count - 1, 1)

  // Push the rounded active index to React state only when it changes.
  const setActiveIndex = useCallback(
    (i: number) => {
      const next = clamp(Math.round(i), 0, lastN)
      if (next === activeRef.current) return
      activeRef.current = next
      setActiveIndexState(next)
    },
    [lastN],
  )

  // Emit the current continuous position to every subscriber + sync state.
  const emit = useCallback(
    (pos: number) => {
      const p = lastN === 0 ? 0 : pos / lastN
      progressRef.current = p
      const idx = clamp(Math.round(pos), 0, lastN)
      framesRef.current.forEach((cb) => cb(p, idx))
      setActiveIndex(idx)
    },
    [lastN, setActiveIndex],
  )

  const registerFrame = useCallback(
    (cb: FrameCb) => {
      framesRef.current.add(cb)
      cb(progressRef.current, activeRef.current) // prime so it isn't blank
      return () => {
        framesRef.current.delete(cb)
      }
    },
    [],
  )

  // Animate displayPos → a whole index (the snap). Reduced motion = instant.
  const animateTo = useCallback(
    (target: number, opts?: { immediate?: boolean }) => {
      const to = clamp(Math.round(target), 0, lastN)
      committedRef.current = to
      tweenRef.current?.kill()
      const instant = opts?.immediate || reducedMotion
      if (instant || typeof window === 'undefined') {
        displayPosRef.current = to
        emit(to)
        return
      }
      const proxy = { v: displayPosRef.current }
      tweenRef.current = gsap.to(proxy, {
        v: to,
        duration: TWEEN_DUR,
        ease: 'expo.out',
        onUpdate: () => {
          displayPosRef.current = proxy.v
          emit(proxy.v)
        },
        onComplete: () => {
          displayPosRef.current = to
          emit(to)
        },
      })
    },
    [emit, lastN, reducedMotion],
  )

  const goToIndex = useCallback(
    (i: number, opts?: { immediate?: boolean }) => animateTo(i, opts),
    [animateTo],
  )

  // ---- Wheel + drag + keyboard (browser only) -----------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stage = stageRef.current
    if (!stage) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReducedMotion(reduce)
    setReady(true)
    emit(0)

    // ---------- WHEEL: preview toward neighbour, settle to a step ----------
    let wheelAccum = 0
    let settleTimer: number | undefined

    const settleWheel = () => {
      const target = Math.round(displayPosRef.current) // commit if past .5, else revert
      wheelAccum = 0
      animateTo(target)
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault() // the stage never scrolls; we own the gesture
      // normalise line/page deltas to pixels
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? stage.clientHeight : 1
      tweenRef.current?.kill()
      wheelAccum += e.deltaY * unit
      // preview at most one step away from the committed work
      const preview = committedRef.current + clamp(wheelAccum / WHEEL_SPAN, -1, 1)
      displayPosRef.current = clamp(preview, 0, lastN)
      emit(displayPosRef.current)
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(settleWheel, WHEEL_SETTLE_MS)
    }

    // ---------- DRAG: live scrub, snap to nearest on release ----------
    let dragging = false
    let engaged = false
    let startY = 0
    let startPos = 0
    let lastY = 0
    let lastT = 0
    let velocity = 0 // index-units / sec
    let justDragged = false
    let activePointer: number | null = null

    const onPointerDown = (e: PointerEvent) => {
      if (e.button != null && e.button !== 0) return // primary button only
      dragging = true
      engaged = false
      activePointer = e.pointerId
      startY = lastY = e.clientY
      startPos = displayPosRef.current
      lastT = e.timeStamp
      velocity = 0
      window.addEventListener('pointermove', onPointerMove, { passive: false })
      window.addEventListener('pointerup', onPointerUp)
      window.addEventListener('pointercancel', onPointerUp)
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || (activePointer != null && e.pointerId !== activePointer)) return
      const dy = startY - e.clientY // up = forward
      if (!engaged) {
        if (Math.abs(dy) < DRAG_ENGAGE_PX) return
        engaged = true
        tweenRef.current?.kill()
      }
      e.preventDefault()
      const pos = clamp(startPos + dy / DRAG_SPAN, 0, lastN)
      const dt = Math.max(1, e.timeStamp - lastT)
      velocity = ((lastY - e.clientY) / DRAG_SPAN / dt) * 1000
      lastY = e.clientY
      lastT = e.timeStamp
      displayPosRef.current = pos
      emit(pos)
    }

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      activePointer = null
      if (!dragging) return
      dragging = false
      if (!engaged) return // it was a click — let the target handle it
      // Snap to the nearest work. A fast flick that fell SHORT of the halfway
      // line still commits one step in the flick's direction (never an extra).
      const pos = displayPosRef.current
      let target = Math.round(pos)
      if (Math.abs(velocity) > FLICK_V && target === Math.round(startPos)) {
        target += velocity > 0 ? 1 : -1
      }
      justDragged = true
      window.setTimeout(() => (justDragged = false), 0)
      animateTo(target)
    }

    // Suppress the click that fires right after a drag (so dragging a thumb /
    // hero doesn't also navigate or select).
    const onClickCapture = (e: MouseEvent) => {
      if (justDragged) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('pointerdown', onPointerDown)
    stage.addEventListener('click', onClickCapture, true)

    return () => {
      window.clearTimeout(settleTimer)
      tweenRef.current?.kill()
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('pointerdown', onPointerDown)
      stage.removeEventListener('click', onClickCapture, true)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [animateTo, emit, lastN])

  // ---- Keyboard: ArrowUp/Down + PageUp/Down + Home/End --------------------
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      let next: number | null = null
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          next = committedRef.current + 1
          break
        case 'ArrowUp':
        case 'PageUp':
          next = committedRef.current - 1
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = lastN
          break
        default:
          return
      }
      next = clamp(next, 0, lastN)
      if (next === committedRef.current) return
      e.preventDefault()
      animateTo(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [animateTo, lastN])

  return {
    stageRef,
    activeIndex,
    setActiveIndex,
    progressRef,
    registerFrame,
    goToIndex,
    ready,
    reducedMotion,
  }
}
