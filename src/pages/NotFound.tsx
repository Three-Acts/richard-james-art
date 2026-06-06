import { Link } from 'react-router-dom'
import { Seo } from '@/lib/seo'
import Reveal from '@/components/ui/Reveal'

export function Component() {
  return (
    <>
      <Seo title="Not found" noIndex />

      <section className="u-container grid min-h-[calc(100vh-var(--nav-h))] place-content-center py-32 text-center">
        <Reveal>
          <p className="u-eyebrow text-gold">Lost the thread</p>
          <h1 className="u-display mt-6 text-[clamp(4rem,18vw,11rem)] leading-none text-bone">
            404
          </h1>
          <span aria-hidden className="mx-auto mt-10 block h-px w-16 bg-gold/50" />
          <p className="mx-auto mt-10 max-w-sm text-[0.98rem] leading-relaxed text-bone-dim [text-wrap:balance]">
            This page has returned to the unborn. The work, however, remains.
          </p>
          <Link to="/" className="btn-line mx-auto mt-12">
            Return home
          </Link>
        </Reveal>
      </section>
    </>
  )
}
