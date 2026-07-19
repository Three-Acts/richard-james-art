import { useCallback, useEffect, useRef, useState } from 'react'
import { Seo } from '@/lib/seo'
import { site } from '@/data/site'
import Reveal from '@/components/ui/Reveal'

/** Small client-only "copy" affordance next to a contact line. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const onCopy = useCallback(async () => {
    // navigator.clipboard is browser-only; guard for SSR / unsupported.
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard denied — silently ignore */
    }
  }, [value])

  return (
    <button
      type="button"
      onClick={onCopy}
      className="u-eyebrow inline-flex items-center gap-2 rounded-full border border-line-soft px-3 py-1.5 text-[0.62rem] text-muted transition-colors duration-500 ease-out-expo hover:border-gold/50 hover:text-gold-bright focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
    >
      <span aria-live="polite">
        {copied ? `${label} copied` : `Copy ${label}`}
      </span>
    </button>
  )
}

/** One line of the contact index: eyebrow label / large value / copy. */
function ContactRow({
  label,
  href,
  value,
  copyLabel,
}: {
  label: string
  href: string
  value: string
  copyLabel: string
}) {
  // Label + copy affordance share the top line; the value gets the full row
  // width beneath (Cinzel runs wide — the email address needs all of it).
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-y-5 py-10 md:py-12">
      <dt className="u-eyebrow text-muted">{label}</dt>
      <dd className="col-span-2 row-start-2 min-w-0">
        <a
          href={href}
          className="link-underline font-display text-[clamp(1.05rem,4.8vw,2.2rem)] leading-tight tracking-[0.01em] text-bone [overflow-wrap:anywhere] transition-colors duration-500 ease-out-expo hover:text-gold-bright focus-visible:text-gold-bright focus-visible:outline-none"
        >
          {value}
        </a>
      </dd>
      <dd className="col-start-2 row-start-1 justify-self-end">
        <CopyButton value={value} label={copyLabel} />
      </dd>
    </div>
  )
}

/**
 * Contact — an editorial two-column spread rather than a centred stack:
 * the heading sits on the left, and the ways to reach Richard read as a
 * ruled index on the right (label / value / copy per line).
 */
export function Component() {
  return (
    <>
      <Seo title="Contact" path="/contact" />

      <section className="u-container flex min-h-[calc(100vh-var(--nav-h))] items-center py-32">
        <div className="grid w-full grid-cols-1 gap-x-[clamp(4rem,8vw,8rem)] gap-y-16 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          {/* Heading column */}
          <Reveal as="header">
            <p className="u-eyebrow text-gold">Get in Touch</p>
            <h1 className="u-display mt-6 text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] text-bone">
              Contact
            </h1>
            <p className="mt-7 max-w-sm text-[0.98rem] leading-relaxed text-bone-dim [text-wrap:pretty]">
              Contact Richard directly by email or phone.
            </p>
          </Reveal>

          {/* Ruled contact index */}
          <Reveal delay={0.12} className="self-center">
            <dl className="divide-y divide-line-soft border-y border-line-soft">
              <ContactRow
                label="Email"
                href={`mailto:${site.email}`}
                value={site.email}
                copyLabel="email address"
              />
              <ContactRow
                label="Phone"
                href={site.phoneHref}
                value={site.phone}
                copyLabel="phone number"
              />
            </dl>
          </Reveal>
        </div>
      </section>
    </>
  )
}
