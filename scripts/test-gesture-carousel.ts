import assert from 'node:assert/strict'
import { GestureCarouselEngine } from '../src/lib/gesture-carousel.ts'

const feed = (
  engine: GestureCarouselEngine,
  deltas: number[],
  startTime = 1,
  step = 16,
) => {
  let time = startTime
  for (const delta of deltas) {
    engine.pushWheel(delta, time)
    time += step
  }
  return time
}

// A normal trackpad swipe advances one slide after its momentum settles.
{
  const engine = new GestureCarouselEngine(6)
  feed(engine, [5, 15, 25, 20, 15, 10])
  assert.equal(engine.settleWheel(), 1)
}

// A second swipe accelerating inside the first swipe's momentum tail must be
// counted independently instead of being swallowed by the one-step clamp.
{
  const engine = new GestureCarouselEngine(6)
  feed(engine, [5, 15, 25, 20, 12, 8, 18, 30, 22])
  assert.equal(engine.settleWheel(), 2)
}

// New input during an unfinished settle tween starts from the visible position
// while retaining the logical destination of the previous gesture.
{
  const engine = new GestureCarouselEngine(6)
  feed(engine, [70])
  assert.equal(engine.settleWheel(), 1)
  engine.setPosition(0.4)
  feed(engine, [70], 200)
  assert.equal(engine.settleWheel(), 2)
}

// Line/page-mode mouse wheel events can explicitly mark separate notches.
{
  const engine = new GestureCarouselEngine(6)
  engine.pushWheel(80, 1)
  engine.pushWheel(80, 17, true)
  assert.equal(engine.settleWheel(), 2)
}

// Small presses remain clicks; a short fast drag is treated as a flick.
{
  const engine = new GestureCarouselEngine(6)
  engine.beginDrag(100, 1)
  engine.moveDrag(96, 10)
  assert.deepEqual(engine.endDrag(), { engaged: false, target: 0 })

  engine.beginDrag(100, 20)
  engine.moveDrag(80, 40)
  assert.deepEqual(engine.endDrag(), { engaged: true, target: 1 })
}

// Bounds are stable for single-item and end-of-list carousels.
{
  const single = new GestureCarouselEngine(1)
  feed(single, [500])
  assert.equal(single.settleWheel(), 0)
  assert.equal(single.snapshot().progress, 0)

  const end = new GestureCarouselEngine(3, 2)
  feed(end, [500])
  assert.equal(end.settleWheel(), 2)
}

console.log('gesture carousel tests passed')
