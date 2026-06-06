import { Fragment } from 'react'
import { Seo } from '@/lib/seo'
import { essayBlocks } from '@/data/pages'
import Reveal from '@/components/ui/Reveal'

/**
 * Long-form reading layout for the essay "The Unborn Rags of the Mind".
 * h1 → hero title (with "Essay" eyebrow); h2 → section headings;
 * p → prose in a measured column; li → reference list at the foot.
 * The first paragraph receives a drop-cap.
 */
export function Component() {
  // Index of the first prose paragraph, so only it gets the drop-cap.
  const firstParagraph = essayBlocks.findIndex((b) => b.tag === 'p')

  return (
    <>
      <Seo
        title="Essay — The Unborn Rags of the Mind"
        path="/essay"
        type="article"
      />

      <article className="u-container pb-32 pt-[calc(var(--nav-h)+clamp(4rem,12vw,9rem))]">
        {essayBlocks.map((block, i) => {
          const key = `${block.tag}-${i}`

          if (block.tag === 'h1') {
            return (
              <Reveal as="header" key={key} className="u-prose mx-auto text-center">
                <p className="u-eyebrow text-gold">Essay</p>
                <h1 className="u-display mt-6 text-[clamp(2rem,6vw,3.75rem)] leading-[1.06] text-bone">
                  {block.text}
                </h1>
                <span
                  aria-hidden
                  className="mx-auto mt-10 block h-px w-16 bg-gold/60"
                />
              </Reveal>
            )
          }

          if (block.tag === 'h2') {
            const isReferences = block.text.toLowerCase() === 'references'
            return (
              <Reveal
                as="h2"
                key={key}
                className={[
                  'u-prose u-display mx-auto text-balance text-[1.1rem] leading-snug text-bone',
                  isReferences
                    ? 'mt-24 border-t border-line-soft pt-12'
                    : 'mt-20',
                ].join(' ')}
              >
                {block.text}
              </Reveal>
            )
          }

          if (block.tag === 'h3') {
            return (
              <Reveal
                as="h3"
                key={key}
                className="u-prose u-display mx-auto mt-12 text-[0.95rem] tracking-[0.06em] text-bone-dim"
              >
                {block.text}
              </Reveal>
            )
          }

          if (block.tag === 'li') {
            return (
              <Reveal
                as="p"
                key={key}
                y={14}
                className="u-prose mx-auto mt-4 pl-6 -indent-6 text-[0.85rem] leading-relaxed text-muted [text-wrap:pretty]"
              >
                {block.text}
              </Reveal>
            )
          }

          // Paragraph
          const isFirst = i === firstParagraph
          return (
            <Reveal
              as="p"
              key={key}
              className={[
                'u-prose mx-auto mt-6 text-[1.02rem] leading-[1.85] text-bone-dim [text-wrap:pretty]',
                isFirst
                  ? "first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:font-display first-letter:text-[3.4rem] first-letter:leading-[0.72] first-letter:text-gold"
                  : '',
              ].join(' ')}
            >
              {block.text}
            </Reveal>
          )
        })}

        {/* Closing flourish */}
        <Reveal className="u-prose mx-auto mt-24 text-center">
          <span aria-hidden className="mx-auto block h-px w-10 bg-line" />
          <Fragment />
        </Reveal>
      </article>
    </>
  )
}
