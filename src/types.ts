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
  /** All gallery image paths in order */
  images: string[]
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
