import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import {
  GestureCarouselEngine,
  type GestureCarouselOverrides,
  type GestureCarouselSnapshot,
} from '@/lib/gesture-carousel'

/**
 * A programmatic long move (year filter, distant thumbnail, Home/End). While
 * one is animating, frame consumers that render the continuous position may
 * instead crossfade straight between `from` and `to` — the position stream
 * still glides the full distance for consumers that want it (the rail).
 */
export interface CarouselJump {
  from: number
  to: number
}

type FrameCallback = (progress: number, activeIndex: number, jump: CarouselJump | null) => void

export interface GestureCarouselApi {
  /** Attach to the element that owns wheel and pointer gestures. */
  stageRef: React.RefObject<HTMLDivElement>
  activeIndex: number
  progressRef: React.MutableRefObject<number>
  registerFrame: (callback: FrameCallback) => () => void
  goToIndex: (index: number, options?: { immediate?: boolean }) => void
  ready: boolean
  reducedMotion: boolean
}

// Wheel-stream classification. Discrete mouse notches arrive as isolated
// large jumps (or line/page deltaMode); trackpads stream small pixel deltas
// every frame. A notch delta below this can only be a trackpad.
const NOTCH_MIN_DELTA = 80
// A notch is "isolated": anything following faster than this is a stream.
const NOTCH_MIN_GAP_MS = 60
// Real consecutive notches never arrive faster than this; a flick that
// briefly looked notch-like folds into the step already in flight.
const NOTCH_STEP_GAP_MS = 50
// Quiet gap after which the next wheel event is classified afresh.
const STREAM_RESET_MS = 220

/**
 * Shared React/DOM/GSAP adapter for every stepped carousel on the site.
 *
 * Gesture decisions live in GestureCarouselEngine. This hook only normalises
 * browser input, owns one interruptible GSAP tween and broadcasts frames to
 * visual consumers. Wheel, pointer, keyboard and programmatic navigation all
 * converge on the same position and committed index.
 *
 * Wheel input is split by device feel: a discrete mouse notch is one
 * deliberate step (a clean tween to the neighbour), while a trackpad stream
 * keeps the continuous preview + commit-threshold behaviour, with a generous
 * pause before an uncommitted scroll eases back.
 */
export function useGestureCarousel(
  count: number,
  initialIndex = 0,
  overrides: GestureCarouselOverrides = {},
): GestureCarouselApi {
  const stageRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GestureCarouselEngine | null>(null)
  if (!engineRef.current) {
    engineRef.current = new GestureCarouselEngine(count, initialIndex, overrides)
  }
  const engine = engineRef.current

  const first = engine.snapshot()
  const progressRef = useRef(first.progress)
  const activeRef = useRef(first.activeIndex)
  const [activeIndex, setActiveIndex] = useState(first.activeIndex)
  const [ready, setReady] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const frameCallbacks = useRef<Set<FrameCallback>>(new Set())
  const tweenRef = useRef<gsap.core.Tween | null>(null)
  const settleTimerRef = useRef<number | undefined>(undefined)
  const jumpRef = useRef<CarouselJump | null>(null)

  const emit = useCallback((snapshot: GestureCarouselSnapshot) => {
    progressRef.current = snapshot.progress
    const jump = jumpRef.current
    let display = snapshot.activeIndex
    if (jump) {
      // During a jump the works in between are never "active": the announced
      // index flips once, at the crossfade midpoint.
      const span = jump.to - jump.from
      const t = span === 0 ? 1 : (snapshot.position - jump.from) / span
      display = t >= 0.5 ? jump.to : jump.from
    }
    frameCallbacks.current.forEach((callback) =>
      callback(snapshot.progress, display, jump),
    )
    if (display !== activeRef.current) {
      activeRef.current = display
      setActiveIndex(display)
    }
  }, [])

  const registerFrame = useCallback((callback: FrameCallback) => {
    frameCallbacks.current.add(callback)
    callback(progressRef.current, activeRef.current, jumpRef.current)
    return () => frameCallbacks.current.delete(callback)
  }, [])

  const stopTween = useCallback(() => {
    tweenRef.current?.kill()
    tweenRef.current = null
  }, [])

  /**
   * A gesture arriving mid-jump lands the carousel on whichever end the
   * crossfade is visually closest to, so the new gesture starts from what is
   * actually on screen rather than a fractional position deep in the list.
   */
  const interruptJump = useCallback(() => {
    const jump = jumpRef.current
    if (!jump) return
    jumpRef.current = null
    const span = jump.to - jump.from
    const t = span === 0 ? 1 : (engine.position - jump.from) / span
    emit(engine.jumpTo(t >= 0.5 ? jump.to : jump.from))
  }, [emit, engine])

  const animateTo = useCallback(
    (index: number, options?: { immediate?: boolean; soft?: boolean }) => {
      window.clearTimeout(settleTimerRef.current)
      engine.cancelWheel()
      const target = engine.commit(index)
      stopTween()

      if (options?.immediate || reducedMotion) {
        jumpRef.current = null
        emit(engine.jumpTo(target))
        return
      }

      const from = engine.position
      const distance = Math.abs(target - from)
      if (distance < 0.0001) {
        jumpRef.current = null
        emit(engine.setPosition(target))
        return
      }

      // A long programmatic move still tweens the whole distance (the rail
      // glides through it), but consumers receive the jump descriptor so the
      // centre stage can render it as ONE crossfade instead of flickering
      // through every work in between.
      jumpRef.current =
        distance > 1.5 ? { from: activeRef.current, to: target } : null

      const proxy = { position: from }
      // Short remaining distances should finish quickly. A fixed long duration
      // after interruption is what made a half-completed lightbox move look as
      // though it had frozen between images. A soft settle is the give-back
      // after an uncommitted scroll: slightly longer, and starting slow, so it
      // never feels like it is snatching the carousel out of the hand.
      const duration = options?.soft
        ? Math.max(0.5, engine.options.snapDuration * 0.85)
        : Math.max(
            0.28,
            engine.options.snapDuration * Math.min(1, 0.55 + distance * 0.45),
          )
      tweenRef.current = gsap.to(proxy, {
        position: target,
        duration,
        ease: options?.soft ? 'power2.inOut' : engine.options.snapEase,
        overwrite: 'auto',
        onUpdate: () => emit(engine.setPosition(proxy.position)),
        onComplete: () => {
          tweenRef.current = null
          jumpRef.current = null
          emit(engine.setPosition(target))
        },
      })
    },
    [emit, engine, reducedMotion, stopTween],
  )

  const goToIndex = useCallback(
    (index: number, options?: { immediate?: boolean }) => animateTo(index, options),
    [animateTo],
  )

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReducedMotion(reduce)
    setReady(true)
    emit(engine.snapshot())

    const horizontal = engine.options.axis === 'x'

    const settleWheel = () => {
      const before = engine.committedIndex
      const target = engine.settleWheel()
      // target === before means nothing committed: this is the ease-back.
      animateTo(target, { soft: target === before })
    }

    let wheelMode: 'notch' | 'smooth' | null = null
    let lastWheelAt = 0
    let lastNotchAt = 0

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      // Mouse wheels only ever emit deltaY, so a horizontal stage adopts
      // whichever axis carries the gesture (trackpads swipe with deltaX).
      const raw = horizontal
        ? Math.abs(event.deltaX) >= Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
        : event.deltaY
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? horizontal
              ? stage.clientWidth
              : stage.clientHeight
            : 1
      const delta = raw * unit
      if (delta === 0) return

      const now = event.timeStamp
      const gap = lastWheelAt ? now - lastWheelAt : Infinity
      lastWheelAt = now
      if (gap > STREAM_RESET_MS) wheelMode = null

      if (wheelMode === null) {
        wheelMode =
          event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL ||
          (Math.abs(delta) >= NOTCH_MIN_DELTA && gap >= NOTCH_MIN_GAP_MS)
            ? 'notch'
            : 'smooth'
      } else if (
        wheelMode === 'notch' &&
        event.deltaMode === WheelEvent.DOM_DELTA_PIXEL &&
        Math.abs(delta) < NOTCH_MIN_DELTA
      ) {
        // The burst turned continuous — it was a trackpad after all.
        wheelMode = 'smooth'
      }

      if (wheelMode === 'notch') {
        if (now - lastNotchAt < NOTCH_STEP_GAP_MS) return
        lastNotchAt = now
        // One physical notch = one deliberate, fully animated step. No
        // accumulate-then-settle: the half-jump-then-tween split is what made
        // the mouse wheel feel unrelated to the trackpad.
        animateTo(engine.committedIndex + (delta > 0 ? 1 : -1))
        return
      }

      stopTween()
      interruptJump()
      const update = engine.pushWheel(delta, now, false)
      emit(update)
      window.clearTimeout(settleTimerRef.current)
      // Past the threshold: commit promptly. Short of it: wait much longer
      // before easing back — trackpad fingers pause mid-gesture, and an eager
      // snap-back fights the scroll they are about to continue.
      const offset = Math.abs(update.position - update.committedIndex)
      settleTimerRef.current = window.setTimeout(
        settleWheel,
        offset >= engine.options.commitThreshold
          ? engine.options.wheelSettleMs
          : engine.options.wheelReturnMs,
      )
    }

    let activePointer: number | null = null
    let pointerCaptured = false
    let justDragged = false

    const coordinate = (event: PointerEvent) =>
      horizontal ? event.clientX : event.clientY

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return
      stopTween()
      interruptJump()
      window.clearTimeout(settleTimerRef.current)
      activePointer = event.pointerId
      pointerCaptured = false
      engine.beginDrag(coordinate(event), event.timeStamp)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (activePointer !== event.pointerId) return
      const update = engine.moveDrag(coordinate(event), event.timeStamp)
      if (!update.engaged) return
      event.preventDefault()
      // Capture only once this is definitely a drag. Capturing on pointerdown
      // retargets an ordinary click to the stage in some browsers, swallowing
      // the project link even though its hover state is visible.
      if (!pointerCaptured) {
        try {
          stage.setPointerCapture(event.pointerId)
          pointerCaptured = true
        } catch {
          // Synthetic pointers may not be capturable; the current movement can
          // still be applied and normal cleanup remains safe.
        }
      }
      emit(update)
    }

    const finishPointer = (event: PointerEvent) => {
      if (activePointer !== event.pointerId) return
      activePointer = null
      pointerCaptured = false
      const result = engine.endDrag()
      if (!result.engaged) return
      justDragged = true
      window.setTimeout(() => {
        justDragged = false
      }, 0)
      animateTo(result.target)
    }

    const onClickCapture = (event: MouseEvent) => {
      if (!justDragged) return
      event.preventDefault()
      event.stopPropagation()
    }

    const onDragStart = (event: DragEvent) => event.preventDefault()

    stage.addEventListener('wheel', onWheel, { passive: false })
    stage.addEventListener('pointerdown', onPointerDown)
    stage.addEventListener('pointermove', onPointerMove, { passive: false })
    stage.addEventListener('pointerup', finishPointer)
    stage.addEventListener('pointercancel', finishPointer)
    stage.addEventListener('click', onClickCapture, true)
    stage.addEventListener('dragstart', onDragStart)

    return () => {
      window.clearTimeout(settleTimerRef.current)
      stopTween()
      stage.removeEventListener('wheel', onWheel)
      stage.removeEventListener('pointerdown', onPointerDown)
      stage.removeEventListener('pointermove', onPointerMove)
      stage.removeEventListener('pointerup', finishPointer)
      stage.removeEventListener('pointercancel', finishPointer)
      stage.removeEventListener('click', onClickCapture, true)
      stage.removeEventListener('dragstart', onDragStart)
    }
  }, [animateTo, emit, engine, interruptJump, stopTween])

  useEffect(() => {
    const horizontal = engine.options.axis === 'x'
    const forwardKey = horizontal ? 'ArrowRight' : 'ArrowDown'
    const backKey = horizontal ? 'ArrowLeft' : 'ArrowUp'

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return

      let next: number | null = null
      if (event.key === forwardKey || event.key === 'PageDown') {
        next = engine.committedIndex + 1
      } else if (event.key === backKey || event.key === 'PageUp') {
        next = engine.committedIndex - 1
      } else if (event.key === 'Home') {
        next = 0
      } else if (event.key === 'End') {
        next = engine.lastIndex
      } else {
        return
      }
      event.preventDefault()
      animateTo(next)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [animateTo, engine])

  return useMemo(
    () => ({
      stageRef,
      activeIndex,
      progressRef,
      registerFrame,
      goToIndex,
      ready,
      reducedMotion,
    }),
    [activeIndex, goToIndex, ready, reducedMotion, registerFrame],
  )
}
