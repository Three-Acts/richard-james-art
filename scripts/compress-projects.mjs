/**
 * One-off compressor for public/images/projects.
 *
 * Converts every PNG under that folder to AVIF, aiming for ~100 KB per image
 * while keeping ~90% perceived quality. Strategy: hold AVIF quality in a high
 * band (63 → 50, all comfortably ~90%+ perceived) and, only when even the
 * lowest band still exceeds the size ceiling at full resolution, step the width
 * down (never below MIN_WIDTH) — so we trade a little resolution, not quality,
 * on the few very detailed images. Simple/dark works land far under 100 KB at
 * top quality and full resolution.
 *
 * Writes <name>.avif beside each <name>.png and removes the PNG.
 *
 * Usage: node scripts/compress-projects.mjs [--dry-run]
 */
import sharp from 'sharp'
import { readdir, stat, writeFile, unlink } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'public/images/projects')

const TARGET = 100 * 1024 // aim
const CEIL = 112 * 1024 // soft ceiling we try to stay under
const MAX_WIDTH = 1920
const MIN_WIDTH = 1200 // don't trade away more resolution than this
const QUALITIES = [63, 56, 50] // high → acceptable; never below ~90% perceived
const WIDTH_FACTOR = 0.82
const EFFORT = 4

const kb = (n) => `${(n / 1024).toFixed(0)}KB`
const dryRun = process.argv.includes('--dry-run')

async function collectPng(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) await collectPng(full, out)
    else if (extname(e.name).toLowerCase() === '.png') out.push(full)
  }
  return out
}

const encode = (src, width, quality) =>
  sharp(src)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .avif({ quality, effort: EFFORT })
    .toBuffer()

/** Largest-resolution / highest-quality encode that fits under CEIL, stepping
 *  resolution down only after every quality in the band overflows. */
async function best(src, startWidth) {
  let width = startWidth
  for (;;) {
    for (const q of QUALITIES) {
      const buf = await encode(src, width, q)
      if (buf.length <= CEIL) return { buf, width, q, floored: false }
    }
    const next = Math.round(width * WIDTH_FACTOR)
    if (next < MIN_WIDTH) {
      const q = QUALITIES[QUALITIES.length - 1]
      return { buf: await encode(src, MIN_WIDTH, q), width: MIN_WIDTH, q, floored: true }
    }
    width = next
  }
}

async function main() {
  const files = (await collectPng(DIR)).sort()
  if (files.length === 0) {
    console.log(`compress-projects: no PNGs under ${relative(ROOT, DIR)}`)
    return
  }

  let bytesBefore = 0
  let bytesAfter = 0
  let over = 0
  let floored = 0
  const sizes = []

  for (const src of files) {
    const rel = relative(DIR, src)
    const meta = await sharp(src).metadata()
    const startWidth = Math.min(meta.width ?? MAX_WIDTH, MAX_WIDTH)
    const { buf, width, q, floored: fl } = await best(src, startWidth)
    const before = (await stat(src)).size

    bytesBefore += before
    bytesAfter += buf.length
    sizes.push(buf.length)
    if (buf.length > TARGET) over++
    if (fl) floored++

    const dest = `${src.slice(0, -extname(src).length)}.avif`
    const flag = buf.length > TARGET ? ' ⚠︎>100KB' : ''
    if (dryRun) {
      console.log(`would  ${rel}  → ${width}px q${q}  ${kb(before)}→${kb(buf.length)}${flag}`)
    } else {
      await writeFile(dest, buf)
      await unlink(src)
      console.log(`✓ ${rel.replace(/\.png$/, '.avif')}  ${width}px q${q}  ${kb(before)}→${kb(buf.length)}${flag}`)
    }
  }

  sizes.sort((a, b) => a - b)
  const median = sizes[Math.floor(sizes.length / 2)]
  console.log(
    `\ncompress-projects: ${files.length} images  ·  ${kb(bytesBefore)} → ${kb(bytesAfter)}` +
      `  ·  median ${kb(median)}, max ${kb(sizes[sizes.length - 1])}` +
      `  ·  ${over} over 100KB (${floored} resolution-floored)` +
      (dryRun ? '  [dry run]' : ''),
  )
}

main().catch((err) => {
  console.error(`compress-projects failed: ${err.message}`)
  process.exit(1)
})
