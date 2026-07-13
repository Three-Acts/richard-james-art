/**
 * A single gallery image with an optional short write-up. The write-up shows
 * as a caption beneath the image in the grid; it is NOT shown in the fullscreen
 * viewer (there we just show the artwork).
 */
export interface GalleryImage {
  /** Image path under public/, e.g. "/images/<slug>/02.avif" */
  src: string
  /** Optional short write-up / caption for this image. */
  caption?: string
}

/**
 * A gallery entry is either a bare image path (no write-up) or a
 * `{ src, caption }` object. The bare-string form keeps data terse for the many
 * images that don't need a caption; use the object form to attach one. Run every
 * entry through `galleryImages()` (see data/projects.ts) to normalise to
 * `GalleryImage[]` before rendering.
 */
export type GalleryEntry = string | GalleryImage

export interface Project {
  /** URL slug, e.g. "ghosts-become-ancestors" */
  slug: string
  /** Display title, e.g. "Ghosts Become Ancestors" */
  title: string
  /** Year of work, e.g. "2025" */
  year: string
  /** Materials & dimensions line */
  medium: string
  /** Body / "slide text" describing the work */
  description: string
  /** Trimmed description for <meta> tags */
  metaDescription: string
  /** Hero image path (public/), e.g. "/images/<slug>/01.avif" */
  hero: string
  /** Thumbnail image path (public/) */
  thumb: string
  /**
   * All gallery images in order. Each entry is a bare path or a
   * `{ src, caption }` object — normalise with `galleryImages(project)`.
   */
  images: GalleryEntry[]
  /** Slug of the next project (wraps around) */
  next: string
}

export interface NavItem {
  label: string
  href: string
}

/** A single block of long-form content (about / essay). */
export interface ContentBlock {
  /** Original semantic tag: h1 | h2 | h3 | p | li */
  tag: string
  text: string
}
