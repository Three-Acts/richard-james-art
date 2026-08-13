import type { APIRoute } from 'astro'
import { site } from '@/data/site'
import { projects } from '@/data/projects'
import { aboutBlocks } from '@/data/pages'

/**
 * /llms.txt — the llmstxt.org convention for AI crawlers and assistants: a
 * plain-markdown index of who the artist is and where everything lives.
 * Generated from the same data files as the pages themselves (projects.ts,
 * pages.ts, site.ts), so it can never drift from the site content.
 */
export const GET: APIRoute = () => {
  const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim()

  const works = projects.map((p) => {
    const detail = p.metaDescription?.trim() || [p.year, p.medium.split('\n')[0]].filter(Boolean).join(', ')
    return `- [${p.title} (${p.year})](${site.url}/projects/${p.slug})${detail ? `: ${oneLine(detail)}` : ''}`
  })

  const text = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    `${site.name} studied sculpture at Central Saint Martins in London, spent seven years as a Zen monk, seven years teaching children and later trained as a counsellor. The work explores Buddhist practice (the kesa, the Unborn), affect theory (Laplanche, Massumi) and their meeting point with psychotherapy.`,
    '',
    '## Pages',
    '',
    `- [Home — all works](${site.url}/): The full portfolio of ${projects.length} works.`,
    `- [Essay — The Unborn Rags of the Mind](${site.url}/essay): Long-form essay on the kesa, affect theory and the Unborn.`,
    `- [About the artist](${site.url}/about): Biography and artistic statement.`,
    `- [Contact](${site.url}/contact): Email ${site.email} · ${site.location}.`,
    '',
    '## Works',
    '',
    ...works,
    '',
    '## About',
    '',
    ...aboutBlocks.map((b) => oneLine(b.text)),
    '',
  ].join('\n')

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
