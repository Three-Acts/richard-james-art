import { useState } from 'react'
import type { Project } from '@/types'
import { galleryImages } from '@/data/projects'
import Image from '@/components/ui/Image'
import Reveal from '@/components/ui/Reveal'
import Lightbox from './Lightbox'

interface GalleryProps {
  project: Project
}

/**
 * The full gallery of a project's images. Free-form heights via CSS
 * multi-column masonry: one column on mobile, two on desktop. Each artwork
 * keeps its natural aspect ratio (no forced ratio) and rises in on scroll
 * with a small per-item delay for a slow, gallery-grade cascade.
 *
 * Each image may carry a short write-up, shown as a caption beneath it. Clicking
 * any image opens the fullscreen viewer (Lightbox) at that image, where the
 * works can be browsed as a cinematic carousel.
 *
 * SSR/no-JS safe: Reveal leaves children visible; columns are pure CSS; the
 * Lightbox only mounts once opened on the client.
 */
export default function Gallery({ project }: GalleryProps) {
  const images = galleryImages(project)
  const total = images.length

  const [open, setOpen] = useState(false)
  const [startIndex, setStartIndex] = useState(0)

  const openAt = (i: number) => {
    setStartIndex(i)
    setOpen(true)
  }

  return (
    <section
      aria-label={`${project.title} — gallery`}
      className="u-container pb-[clamp(5rem,14vh,11rem)]"
    >
      <div className="columns-1 gap-6 md:columns-2 md:gap-8">
        {images.map((img, i) => (
          <figure key={img.src} className="mb-6 break-inside-avoid md:mb-8">
            <Reveal y={32} delay={(i % 2) * 0.08}>
              <button
                type="button"
                onClick={() => openAt(i)}
                aria-label={
                  total > 1
                    ? `View ${project.title} — image ${i + 1} of ${total} full screen`
                    : `View ${project.title} full screen`
                }
                className="group block w-full cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <Image
                  src={img.src}
                  alt={
                    total > 1
                      ? `${project.title} — view ${i + 1} of ${total}`
                      : project.title
                  }
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="w-full transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.02]"
                />
              </button>

              {img.caption && (
                <figcaption className="mt-3 max-w-[42rem] font-body text-sm leading-relaxed text-bone-dim">
                  {img.caption}
                </figcaption>
              )}
            </Reveal>
          </figure>
        ))}
      </div>

      {open && (
        <Lightbox
          images={images}
          startIndex={startIndex}
          title={project.title}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  )
}
