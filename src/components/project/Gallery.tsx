import type { Project } from '@/types'
import Image from '@/components/ui/Image'
import Reveal from '@/components/ui/Reveal'

interface GalleryProps {
  project: Project
}

/**
 * The full gallery of a project's images. Free-form heights via CSS
 * multi-column masonry: one column on mobile, two on desktop. Each artwork
 * keeps its natural aspect ratio (no forced ratio) and rises in on scroll
 * with a small per-item delay for a slow, gallery-grade cascade.
 *
 * SSR/no-JS safe: Reveal leaves children visible; columns are pure CSS.
 */
export default function Gallery({ project }: GalleryProps) {
  const total = project.images.length

  return (
    <section
      aria-label={`${project.title} — gallery`}
      className="u-container pb-[clamp(5rem,14vh,11rem)]"
    >
      <div className="columns-1 gap-6 md:columns-2 md:gap-8">
        {project.images.map((src, i) => (
          <figure key={src} className="mb-6 break-inside-avoid md:mb-8">
            <Reveal y={32} delay={(i % 2) * 0.08}>
              <Image
                src={src}
                alt={
                  total > 1
                    ? `${project.title} — view ${i + 1} of ${total}`
                    : project.title
                }
                sizes="(min-width: 768px) 50vw, 100vw"
                className="w-full"
              />
            </Reveal>
          </figure>
        ))}
      </div>
    </section>
  )
}
