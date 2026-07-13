/**
 * Device-agnostic state machine for the site's stepped carousels.
 *
 * It owns the logical/visual position, wheel impulse boundaries and drag
 * velocity, but deliberately knows nothing about React, the DOM or GSAP. That
 * separation makes rapid trackpad sequences deterministic and testable.
 */

export interface GestureCarouselOptions {
  /** Pixels of wheel movement that preview one complete slide. */
  wheelSpan: number
  /** Pixels of pointer movement that preview one complete slide. */
  dragSpan: number
  /** Index-units/second that turns a short drag into a committed flick. */
  flickVelocity: number
  /** Fraction of a slide required to commit without flick velocity. */
  commitThreshold: number
  /** Pointer movement required before a press becomes a drag. */
  dragMinimum: number
  /** Quiet time used by the DOM adapter to finish a wheel impulse. */
  wheelSettleMs: number
  /** Duration of the GSAP settle tween. */
  snapDuration: number
  /** GSAP easing used by the settle tween. */
  snapEase: string
}

export const DEFAULT_GESTURE_CAROUSEL_OPTIONS: GestureCarouselOptions = {
  wheelSpan: 130,
  dragSpan: 88,
  flickVelocity: 2.4,
  commitThreshold: 0.5,
  dragMinimum: 6,
  wheelSettleMs: 110,
  snapDuration: 0.68,
  snapEase: 'power3.out',
}

export type GestureCarouselOverrides = Partial<GestureCarouselOptions>

export interface GestureCarouselSnapshot {
  position: number
  activeIndex: number
  committedIndex: number
  progress: number
}

export interface WheelUpdate extends GestureCarouselSnapshot {
  restarted: boolean
}

export interface DragUpdate extends GestureCarouselSnapshot {
  engaged: boolean
}

export interface DragEnd {
  engaged: boolean
  target: number
}

const WHEEL_RESTART_RATIO = 1.2
const WHEEL_RESTART_MIN_DELTA = 4
const WHEEL_RESTART_GAP_MS = 48

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export class GestureCarouselEngine {
  readonly options: GestureCarouselOptions
  readonly lastIndex: number

  private positionValue: number
  private committedValue: number

  private wheelActive = false
  private wheelAccum = 0
  private wheelStartPosition = 0
  private lastWheelTime = 0
  private lastWheelDelta = 0
  private wheelDecelerating = false

  private dragActive = false
  private dragEngaged = false
  private dragStartCoordinate = 0
  private dragStartPosition = 0
  private dragLastCoordinate = 0
  private dragLastTime = 0
  private dragVelocity = 0

  constructor(count: number, initialIndex = 0, overrides: GestureCarouselOverrides = {}) {
    this.options = { ...DEFAULT_GESTURE_CAROUSEL_OPTIONS, ...overrides }
    this.lastIndex = Math.max(0, count - 1)
    const start = this.clampIndex(initialIndex)
    this.positionValue = start
    this.committedValue = start
    this.wheelStartPosition = start
  }

  get position(): number {
    return this.positionValue
  }

  get committedIndex(): number {
    return this.committedValue
  }

  snapshot(): GestureCarouselSnapshot {
    return {
      position: this.positionValue,
      activeIndex: this.clampIndex(this.positionValue),
      committedIndex: this.committedValue,
      progress: this.lastIndex === 0 ? 0 : this.positionValue / this.lastIndex,
    }
  }

  /** Update only the rendered position (normally from a GSAP onUpdate). */
  setPosition(position: number): GestureCarouselSnapshot {
    this.positionValue = clamp(position, 0, this.lastIndex)
    return this.snapshot()
  }

  /** Set a new resting index while preserving the current rendered position. */
  commit(index: number): number {
    this.committedValue = this.clampIndex(index)
    return this.committedValue
  }

  /** Set both logical and rendered state immediately. */
  jumpTo(index: number): GestureCarouselSnapshot {
    const target = this.commit(index)
    this.positionValue = target
    this.cancelWheel()
    this.dragActive = false
    return this.snapshot()
  }

  pushWheel(delta: number, time: number, forceRestart = false): WheelUpdate {
    if (!this.wheelActive) {
      this.wheelActive = true
      this.wheelAccum = 0
      this.wheelStartPosition = this.positionValue
      this.lastWheelTime = 0
      this.lastWheelDelta = 0
      this.wheelDecelerating = false
    }

    const absDelta = Math.abs(delta)
    const absLastDelta = Math.abs(this.lastWheelDelta)
    const elapsed = this.lastWheelTime ? time - this.lastWheelTime : 0
    const sameDirection =
      this.lastWheelDelta === 0 || delta === 0 || Math.sign(delta) === Math.sign(this.lastWheelDelta)

    // Browsers expose trackpad momentum as one uninterrupted wheel stream. A
    // fresh swipe shows up as a fall-then-rise in delta magnitude. Discrete
    // mouse wheels (deltaMode line/page) may explicitly force this boundary.
    const restarted =
      this.wheelAccum !== 0 &&
      sameDirection &&
      absDelta >= WHEEL_RESTART_MIN_DELTA &&
      (forceRestart ||
        (this.wheelDecelerating &&
          (absDelta >= absLastDelta * WHEEL_RESTART_RATIO || elapsed >= WHEEL_RESTART_GAP_MS)) ||
        elapsed >= WHEEL_RESTART_GAP_MS * 1.5)

    if (restarted) {
      this.committedValue = this.targetFromOffset(
        clamp(this.wheelAccum / this.options.wheelSpan, -1, 1),
        0,
      )
      this.wheelAccum = 0
      this.wheelStartPosition = this.positionValue
      this.wheelDecelerating = false
    }

    this.wheelAccum += delta
    this.positionValue = clamp(
      this.wheelStartPosition + clamp(this.wheelAccum / this.options.wheelSpan, -1, 1),
      0,
      this.lastIndex,
    )

    if (!restarted && absLastDelta > 0 && absDelta < absLastDelta * 0.9) {
      this.wheelDecelerating = true
    }
    this.lastWheelDelta = delta
    this.lastWheelTime = time

    return { ...this.snapshot(), restarted }
  }

  settleWheel(): number {
    if (!this.wheelActive) return this.committedValue
    const target = this.targetFromOffset(
      clamp(this.wheelAccum / this.options.wheelSpan, -1, 1),
      0,
    )
    this.committedValue = target
    this.cancelWheel()
    return target
  }

  cancelWheel(): void {
    this.wheelActive = false
    this.wheelAccum = 0
    this.wheelStartPosition = this.positionValue
    this.lastWheelTime = 0
    this.lastWheelDelta = 0
    this.wheelDecelerating = false
  }

  beginDrag(coordinate: number, time: number): void {
    this.cancelWheel()
    this.dragActive = true
    this.dragEngaged = false
    this.dragStartCoordinate = coordinate
    this.dragStartPosition = this.positionValue
    this.dragLastCoordinate = coordinate
    this.dragLastTime = time
    this.dragVelocity = 0
  }

  moveDrag(coordinate: number, time: number): DragUpdate {
    if (!this.dragActive) return { ...this.snapshot(), engaged: false }

    const distance = this.dragStartCoordinate - coordinate
    if (!this.dragEngaged && Math.abs(distance) >= this.options.dragMinimum) {
      this.dragEngaged = true
    }
    if (!this.dragEngaged) return { ...this.snapshot(), engaged: false }

    const position = this.dragStartPosition + distance / this.options.dragSpan
    this.positionValue = clamp(
      clamp(position, this.committedValue - 1, this.committedValue + 1),
      0,
      this.lastIndex,
    )

    const elapsed = Math.max(1, time - this.dragLastTime)
    this.dragVelocity =
      ((this.dragLastCoordinate - coordinate) / this.options.dragSpan / elapsed) * 1000
    this.dragLastCoordinate = coordinate
    this.dragLastTime = time
    return { ...this.snapshot(), engaged: true }
  }

  endDrag(): DragEnd {
    if (!this.dragActive) return { engaged: false, target: this.committedValue }
    this.dragActive = false
    if (!this.dragEngaged) return { engaged: false, target: this.committedValue }

    const target = this.targetFromOffset(
      this.positionValue - this.committedValue,
      this.dragVelocity,
    )
    this.committedValue = target
    this.dragEngaged = false
    return { engaged: true, target }
  }

  private targetFromOffset(offset: number, velocity: number): number {
    if (Math.abs(velocity) > this.options.flickVelocity) {
      const direction = velocity > 0 ? 1 : -1
      if ((direction > 0 && offset >= 0) || (direction < 0 && offset <= 0)) {
        return this.clampIndex(this.committedValue + direction)
      }
    }
    if (Math.abs(offset) >= this.options.commitThreshold) {
      return this.clampIndex(this.committedValue + (offset > 0 ? 1 : -1))
    }
    return this.committedValue
  }

  private clampIndex(index: number): number {
    return clamp(Math.round(index), 0, this.lastIndex)
  }
}
