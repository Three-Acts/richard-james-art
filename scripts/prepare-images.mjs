/**
 * Build-time image preparation for public/images.
 *
 * For every raster image found under public/images:
 *   - if it is WIDER than MAX (1920px), downscale to MAX (aspect preserved);
 *     images already ≤ MAX keep their dimensions.
 *   - if it is NOT already AVIF, re-encode to AVIF (and remove the original,
 *     since the extension changes); images already AVIF keep their encoding.
 *
 * Idempotent by design: an image that is already AVIF *and* ≤ MAX is left
 * completely untouched (never re-encoded), so running this on every build never
 * compounds compression artefacts. Runs before the Vite build so the prepared
 * files are what get copied into dist/.
 *
 * Usage: node scripts/prepare-images.mjs
 */
import sharp from 'sharp'
import { readdir, stat, writeFile, rename, unlink, access } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIR = join(ROOT, 'public/images')
const MAX = 1920 // max width in px
const QUALITY = 72 // AVIF quality (matches the Vite optimizer's setting)

// Raster types sharp can decode + re-encode. SVG/GIF are skipped so we never
// rasterise vectors or flatten animations.
const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif'])

const kb = (n) => `${(n / 1024).toFixed(0)} KB`

const exists = (p) =>
  access(p).then(
    () => true,
    () => false,
  )

/** Recursively collect raster image paths under `dir`. */
async function collect(dir, out = []) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return out // folder doesn't exist yet — nothing to do
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) await collect(full, out)
    else if (RASTER.has(extname(entry.name).toLowerCase())) out.push(full)
  }
  return out
}

async function main() {
  const files = await collect(DIR)
  if (files.length === 0) {
    console.log(`prepare-images: no images under ${relative(ROOT, DIR)}`)
    return
  }

  let converted = 0
  let resized = 0
  let skipped = 0
  let failed = 0
  let bytesBefore = 0
  let bytesAfter = 0

  for (const src of files) {
    const ext = extname(src).toLowerCase()
    const isAvif = ext === '.avif'
    const rel = relative(DIR, src)
    try {
      const meta = await sharp(src).metadata()
      const width = meta.width ?? 0
      const tooWide = width > MAX

      // Already AVIF and small enough → leave exactly as-is.
      if (isAvif && !tooWide) {
        skipped++
        continue
      }

      const dest = isAvif ? src : `${src.slice(0, -ext.length)}.avif`

      // Never clobber an existing AVIF: if a non-AVIF source sits beside a
      // same-named .avif, leave both alone (the .avif is the real asset).
      if (!isAvif && (await exists(dest))) {
        console.log(`· skip ${rel} — ${relative(DIR, dest)} already exists`)
        skipped++
        continue
      }

      // .rotate() bakes in EXIF orientation before any downscale.
      const pipeline = sharp(src).rotate()
      if (tooWide) pipeline.resize({ width: MAX, withoutEnlargement: true })
      const buf = await pipeline.avif({ quality: QUALITY }).toBuffer()

      const srcSize = (await stat(src)).size

      // Atomic write: sibling temp file, then rename over the destination.
      const tmp = `${dest}.tmp-prep`
      await writeFile(tmp, buf)
      await rename(tmp, dest)
      // Format changed → drop the non-AVIF original (dest has a new name).
      if (!isAvif) await unlink(src)

      bytesBefore += srcSize
      bytesAfter += buf.length
      if (isAvif) resized++
      else converted++

      const note = [tooWide ? `${width}→${MAX}px` : '', isAvif ? '' : '→avif']
        .filter(Boolean)
        .join('  ')
      console.log(`✓ ${rel}  ${note}  (${kb(srcSize)} → ${kb(buf.length)})`)
    } catch (err) {
      failed++
      console.error(`✗ ${rel}: ${err.message}`)
    }
  }

  console.log(
    `prepare-images: converted ${converted}, resized ${resized}, ` +
      `skipped ${skipped} (already AVIF ≤ ${MAX}px)` +
      (failed ? `, failed ${failed}` : '') +
      (converted || resized ? `  ·  ${kb(bytesBefore)} → ${kb(bytesAfter)}` : ''),
  )
}

main().catch((err) => {
  console.error(`prepare-images failed: ${err.message}`)
  process.exit(1)
})
