import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import {
  GestureCarouselEngine,
  type GestureCarouselOverrides,
  type GestureCarouselSnapshot,
} from '@/lib/gesture-carousel'

type FrameCallback = (progress: number, activeIndex: number) => void

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

/**
 * Shared React/DOM/GSAP adapter for every stepped carousel on the site.
 *
 * Gesture decisions live in GestureCarouselEngine. This hook only normalises
 * browser input, owns one interruptible GSAP tween and broadcasts frames to
 * visual consumers. Wheel, pointer, keyboard and programmatic navigation all
 * converge on the same position and committed index.
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

  const emit = useCallback((snapshot: GestureCarouselSnapshot) => {
    progressRef.current = snapshot.progress
    frameCallbacks.current.forEach((callback) =>
      callback(snapshot.progress, snapshot.activeIndex),
    )
    if (snapshot.activeIndex !== activeRef.current) {
      activeRef.current = snapshot.activeIndex
      setActiveIndex(snapshot.activeIndex)
    }
  }, [])

  const registerFrame = useCallback((callback: FrameCallback) => {
    frameCallbacks.current.add(callback)
    callback(progressRef.current, activeRef.current)
    return () => frameCallbacks.current.delete(callback)
  }, [])

  const stopTween = useCallback(() => {
    tweenRef.current?.kill()
    tweenRef.current = null
  }, [])

  const animateTo = useCallback(
    (index: number, options?: { immediate?: boolean }) => {
      window.clearTimeout(settleTimerRef.current)
      engine.cancelWheel()
      const target = engine.commit(index)
      stopTween()

      if (options?.immediate || reducedMotion) {
        emit(engine.jumpTo(target))
        return
      }

      const from = engine.position
      const distance = Math.abs(target - from)
      if (distance < 0.0001) {
        emit(engine.setPosition(target))
        return
      }

      const proxy = { position: from }
      // Short remaining distances should finish quickly. A fixed long duration
      // after interruption is what made a half-completed lightbox move look as
      // though it had frozen between images.
      const duration = Math.max(
        0.28,
        engine.options.snapDuration * Math.min(1, 0.55 + distance * 0.45),
      )
      tweenRef.current = gsap.to(proxy, {
        position: target,
        duration,
        ease: engine.options.snapEase,
        overwrite: 'auto',
        onUpdate: () => emit(engine.setPosition(proxy.position)),
        onComplete: () => {
          tweenRef.current = null
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

    const settleWheel = () => animateTo(engine.settleWheel())

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? stage.clientHeight
            : 1
      stopTween()
      const update = engine.pushWheel(
        event.deltaY * unit,
        event.timeStamp,
        event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL,
      )
      emit(update)
      window.clearTimeout(settleTimerRef.current)
      settleTimerRef.current = window.setTimeout(
        settleWheel,
        engine.options.wheelSettleMs,
      )
    }

    let activePointer: number | null = null
    let pointerCaptured = false
    let justDragged = false

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return
      stopTween()
      window.clearTimeout(settleTimerRef.current)
      activePointer = event.pointerId
      pointerCaptured = false
      engine.beginDrag(event.clientY, event.timeStamp)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (activePointer !== event.pointerId) return
      const update = engine.moveDrag(event.clientY, event.timeStamp)
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
  }, [animateTo, emit, engine, stopTween])

  useEffect(() => {
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
      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
          next = engine.committedIndex + 1
          break
        case 'ArrowUp':
        case 'PageUp':
          next = engine.committedIndex - 1
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = engine.lastIndex
          break
        default:
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
