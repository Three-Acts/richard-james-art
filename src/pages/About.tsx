import { Link } from 'react-router-dom'
import { Seo, personJsonLd } from '@/lib/seo'
import { aboutBlocks } from '@/data/pages'
import { site } from '@/data/site'
import Image from '@/components/ui/Image'
import Reveal from '@/components/ui/Reveal'

// Portrait of the artist (the original site's About photo).
const portrait = '/images/about/richard-james.avif'

export function Component() {
  // Pull the closing two lines out as a gold "pulled quote" to break the column.
  const body = aboutBlocks.slice(0, aboutBlocks.length - 2)
  const pulled = aboutBlocks.slice(aboutBlocks.length - 2)

  return (
    <>
      <Seo title="About" path="/about" type="profile" jsonLd={personJsonLd()} />

      <section className="u-container pb-32 pt-[calc(var(--nav-h)+clamp(4rem,12vw,9rem))]">
        {/* Heading */}
        <Reveal as="header" className="max-w-3xl">
          <p className="u-eyebrow text-gold">About the Artist</p>
          <h1 className="u-display mt-5 text-[clamp(2.5rem,7vw,5rem)] leading-[0.98] text-bone">
            Richard James
          </h1>
          <p className="mt-6 max-w-prose text-[0.98rem] leading-relaxed text-bone-dim">
            British artist based in Gqeberha (formerly Port Elizabeth),
            South Africa.
          </p>
        </Reveal>

        {/* Body + accent image */}
        <div className="mt-20 grid grid-cols-1 gap-x-16 gap-y-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
          {/* Prose column */}
          <div className="max-w-[42rem]">
            {body.map((block, i) => (
              <Reveal
                as="p"
                key={i}
                className={[
                  'mt-6 text-[1.02rem] leading-[1.85] text-bone-dim [text-wrap:pretty] first:mt-0',
                  i === 0
                    ? "first-letter:float-left first-letter:mr-3 first-letter:mt-2 first-letter:font-display first-letter:text-[3.4rem] first-letter:leading-[0.72] first-letter:text-gold"
                    : '',
                ].join(' ')}
              >
                {block.text}
              </Reveal>
            ))}

            {/* Gold pulled accent line */}
            <Reveal className="mt-14 border-l border-gold/50 pl-7">
              {pulled.map((block, i) => (
                <p
                  key={i}
                  className="font-display text-[1.3rem] leading-[1.45] tracking-[0.01em] text-gold-bright [text-wrap:balance] [&:not(:first-child)]:mt-3"
                >
                  {block.text}
                </p>
              ))}
            </Reveal>
          </div>

          {/* Tall accent artwork */}
          <Reveal
            delay={0.12}
            className="lg:sticky lg:top-[calc(var(--nav-h)+2.5rem)] lg:self-start"
          >
            <figure className="overflow-hidden bg-ink-soft">
              <Image
                src={portrait}
                alt="Portrait of Richard James"
                aspectRatio="4/5"
                sizes="(min-width: 1024px) 22rem, 90vw"
                className="h-full w-full"
              />
            </figure>
            <figcaption className="mt-4 flex items-baseline justify-between gap-4">
              <span className="u-display text-[0.8rem] text-bone-dim">
                Richard James
              </span>
              <span className="u-eyebrow text-faint">{site.location}</span>
            </figcaption>
          </Reveal>
        </div>

        {/* Contact CTA */}
        <Reveal className="mt-28 border-t border-line-soft pt-16 text-center">
          <p className="u-eyebrow text-muted">Contact</p>
          <p className="mx-auto mt-6 max-w-xl font-display text-[clamp(1.4rem,4vw,2.25rem)] leading-tight text-bone [text-wrap:balance]">
            Get in touch with Richard.
          </p>
          <Link to="/contact" className="btn-line mt-10">
            Get in touch
          </Link>
        </Reveal>
      </section>
    </>
  )
}
