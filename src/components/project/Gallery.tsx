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
  const groups = project.galleryGroups
  const images = groups
    ? groups.map((group) => ({
        src: group.src,
        caption: group.captions.join(' / '),
      }))
    : galleryImages(project)
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
      className={
        groups
          ? 'w-full px-[var(--gutter)] pb-[clamp(5rem,14vh,11rem)]'
          : 'u-container pb-[clamp(5rem,14vh,11rem)]'
      }
    >
      {groups ? (
        <div className="flex flex-col gap-[clamp(5rem,13vh,10rem)]">
          {groups.map((group, i) => (
            <Reveal as="figure" key={group.src} y={32}>
              <button
                type="button"
                onClick={() => openAt(i)}
                aria-label={`View ${project.title} — paired photograph ${i + 1} of ${total} full screen`}
                className="group block w-full cursor-zoom-in overflow-hidden focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
              >
                <Image
                  src={group.src}
                  alt={`${project.title} — paired photograph ${i + 1} of ${total}; text: ${group.captions.join(' / ')}`}
                  sizes="100vw"
                  className="w-full transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.01]"
                />
              </button>

              <figcaption className="mt-5 w-full md:w-1/3 lg:w-1/4">
                <p className="u-eyebrow text-faint">Text in work</p>
                <dl className="mt-3 border-t border-line-soft pt-3 font-body text-sm leading-relaxed text-bone-dim">
                  {group.captions.map((caption, captionIndex) => (
                    <div
                      key={`${caption}-${captionIndex}`}
                      className="grid grid-cols-[3.25rem_1fr] gap-3 [&:not(:first-child)]:mt-2"
                    >
                      <dt className="text-muted">
                        {group.captions.length > 1
                          ? captionIndex === 0
                            ? 'Left'
                            : 'Right'
                          : 'Pair'}
                      </dt>
                      <dd>{caption}</dd>
                    </div>
                  ))}
                </dl>
              </figcaption>
            </Reveal>
          ))}
        </div>
      ) : (
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
      )}

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
