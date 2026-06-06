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
      aria-label={`Copy ${label}`}
      className="u-eyebrow inline-flex items-center gap-2 rounded-full border border-line-soft px-3 py-1.5 text-[0.62rem] text-muted transition-colors duration-500 ease-out-expo hover:border-gold/50 hover:text-gold-bright focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60"
    >
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}

function ContactLine({
  href,
  value,
  label,
}: {
  href: string
  value: string
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <a
        href={href}
        className="link-underline font-display text-[clamp(1.4rem,5vw,2.5rem)] leading-tight tracking-[0.01em] text-bone transition-colors duration-500 ease-out-expo hover:text-gold-bright focus-visible:text-gold-bright focus-visible:outline-none"
      >
        {value}
      </a>
      <CopyButton value={value} label={label} />
    </div>
  )
}

export function Component() {
  return (
    <>
      <Seo title="Contact" path="/contact" />

      <section className="u-container grid min-h-[calc(100vh-var(--nav-h))] place-content-center py-32 text-center">
        <Reveal as="header">
          <p className="u-eyebrow text-gold">Get in Touch</p>
          <h1 className="u-display mt-6 text-[clamp(2.75rem,9vw,6rem)] leading-[0.95] text-bone">
            Contact
          </h1>
          <p className="mx-auto mt-7 max-w-md text-[0.98rem] leading-relaxed text-bone-dim [text-wrap:balance]">
            For enquiries, commissions, or to arrange a viewing of the work — by
            email or phone.
          </p>
        </Reveal>

        <Reveal
          delay={0.12}
          className="mt-16 flex flex-col items-center gap-12"
        >
          <ContactLine
            href={`mailto:${site.email}`}
            value={site.email}
            label="email address"
          />
          <span aria-hidden className="block h-px w-12 bg-line" />
          <ContactLine
            href={site.phoneHref}
            value={site.phone}
            label="phone number"
          />
        </Reveal>

        <Reveal delay={0.2} className="mt-16">
          <p className="u-eyebrow text-muted">Based in</p>
          <p className="mt-3 font-display text-[1rem] tracking-[0.04em] text-bone-dim">
            {site.location}
          </p>
        </Reveal>
      </section>
    </>
  )
}
