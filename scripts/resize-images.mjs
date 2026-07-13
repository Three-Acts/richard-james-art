/**
 * Resizes images in a folder down to a maximum width (default 1920px),
 * preserving aspect ratio. Images already at or below the target width are
 * left untouched (not re-encoded), so the script is safe to re-run.
 *
 * By default it overwrites files in place. Use --out <dir> to write resized
 * copies elsewhere (the folder tree is mirrored), or --dry-run to preview.
 *
 * Usage:
 *   node scripts/resize-images.mjs <folder> [options]
 *
 * Options:
 *   --width <px>     Max width in pixels            (default: 1920)
 *   --out <dir>      Write to this dir instead of overwriting in place
 *   --recursive      Recurse into subfolders        (default: on)
 *   --no-recursive   Only process the top-level folder
 *   --dry-run        Report what would change without writing
 *   --quality <n>    JPEG/WebP/AVIF quality 1–100   (default: 82)
 *
 * Examples:
 *   node scripts/resize-images.mjs public/images
 *   node scripts/resize-images.mjs ~/Desktop/photos --width 1600 --out ~/Desktop/photos-web
 *   node scripts/resize-images.mjs public/images --dry-run
 */
import sharp from 'sharp'
import { readdir, mkdir, writeFile, rename, stat } from 'node:fs/promises'
import { resolve, join, relative, dirname, extname } from 'node:path'

// File types sharp can decode + re-encode cleanly. SVG/GIF are skipped to
// avoid rasterising vectors or flattening animations.
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tiff', '.tif'])

function parseArgs(argv) {
  const opts = {
    folder: null,
    width: 1920,
    out: null,
    recursive: true,
    dryRun: false,
    quality: 82,
  }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    switch (a) {
      case '--width': opts.width = Number(argv[++i]); break
      case '--out': opts.out = resolve(argv[++i]); break
      case '--recursive': opts.recursive = true; break
      case '--no-recursive': opts.recursive = false; break
      case '--dry-run': case '--dry': opts.dryRun = true; break
      case '--quality': opts.quality = Number(argv[++i]); break
      default:
        if (a.startsWith('--')) throw new Error(`Unknown option: ${a}`)
        if (opts.folder) throw new Error(`Unexpected extra argument: ${a}`)
        opts.folder = resolve(a)
    }
  }
  if (!opts.folder) throw new Error('Missing <folder> argument.')
  if (!Number.isFinite(opts.width) || opts.width < 1)
    throw new Error('--width must be a positive number.')
  return opts
}

/** Recursively collect image file paths under `dir`. */
async function collectImages(dir, recursive) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (recursive) out.push(...(await collectImages(full, recursive)))
    } else if (entry.isFile() && EXTS.has(extname(entry.name).toLowerCase())) {
      out.push(full)
    }
  }
  return out
}

/** Re-encode a resized buffer in the source's own format, honouring quality. */
function encode(pipeline, ext, quality) {
  switch (ext) {
    case '.jpg': case '.jpeg': return pipeline.jpeg({ quality, mozjpeg: true })
    case '.png':                return pipeline.png()
    case '.webp':               return pipeline.webp({ quality })
    case '.avif':               return pipeline.avif({ quality })
    case '.tiff': case '.tif':  return pipeline.tiff()
    default:                    return pipeline
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2))
  const images = await collectImages(opts.folder, opts.recursive)

  if (images.length === 0) {
    console.log(`No images found in ${opts.folder}`)
    return
  }

  let resized = 0, skipped = 0, failed = 0, bytesBefore = 0, bytesAfter = 0

  for (const src of images) {
    const ext = extname(src).toLowerCase()
    const rel = relative(opts.folder, src)
    try {
      const meta = await sharp(src).metadata()
      const width = meta.width ?? 0

      if (width <= opts.width) {
        skipped++
        continue
      }

      // Resize from a decoded buffer so we never read & write the same path
      // at once. .rotate() bakes in EXIF orientation before downscaling.
      const buf = await encode(
        sharp(src).rotate().resize({ width: opts.width, withoutEnlargement: true }),
        ext,
        opts.quality
      ).toBuffer()

      const before = (await stat(src)).size
      const dest = opts.out ? join(opts.out, rel) : src

      if (opts.dryRun) {
        console.log(`would resize  ${rel}  ${width}px → ${opts.width}px`)
      } else if (opts.out) {
        await mkdir(dirname(dest), { recursive: true })
        await writeFile(dest, buf)
      } else {
        // Atomic in-place replace: write a sibling temp file, then rename.
        const tmp = `${src}.tmp-resize`
        await writeFile(tmp, buf)
        await rename(tmp, src)
      }

      bytesBefore += before
      bytesAfter += buf.length
      resized++
      if (!opts.dryRun)
        console.log(`✓ ${rel}  ${width}px → ${opts.width}px  (${kb(before)} → ${kb(buf.length)})`)
    } catch (err) {
      failed++
      console.error(`✗ ${rel}: ${err.message}`)
    }
  }

  const verb = opts.dryRun ? 'would resize' : 'resized'
  console.log(
    `\nDone — ${verb} ${resized}, skipped ${skipped} (already ≤ ${opts.width}px)` +
    (failed ? `, failed ${failed}` : '') +
    (resized && !opts.dryRun ? `  ·  ${kb(bytesBefore)} → ${kb(bytesAfter)}` : '')
  )
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`

main().catch((err) => {
  console.error(`✗ resize-images failed: ${err.message}`)
  process.exit(1)
})
