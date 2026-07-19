import { Link } from 'react-router-dom'
import { nav, site } from '@/data/site'

/**
 * Refined site footer: wordmark + tagline/location, navigation, contact
 * (email + phone) and a quiet copyright / credit line. Dark, with a hairline
 * top border to seat it under the page content.
 */
export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line bg-ink">
      <div className="u-container py-16 md:py-24">
        <div className="flex flex-col gap-14 lg:flex-row lg:justify-between">
          {/* Identity */}
          <div className="max-w-sm">
            <Link
              to="/"
              className="u-display text-xl tracking-[0.18em] text-bone transition-colors duration-500 hover:text-gold-bright focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
            >
              {site.name}
            </Link>
            <p className="mt-4 font-body text-bone-dim">{site.tagline}</p>
            <p className="u-eyebrow mt-5">{site.location}</p>
          </div>

          {/* Navigation + contact */}
          <div className="flex flex-col gap-12 sm:flex-row sm:gap-20">
            <nav aria-label="Footer">
              <h2 className="u-eyebrow mb-5 text-faint">Index</h2>
              <ul className="flex flex-col gap-3">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className="link-underline font-body text-bone-dim transition-colors duration-500 hover:text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <h2 className="u-eyebrow mb-5 text-faint">Contact</h2>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href={`mailto:${site.email}`}
                    className="link-underline font-body text-bone-dim transition-colors duration-500 hover:text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
                  >
                    {site.email}
                  </a>
                </li>
                <li>
                  <a
                    href={site.phoneHref}
                    className="link-underline font-body text-bone-dim transition-colors duration-500 hover:text-bone focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-gold"
                  >
                    {site.phone}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Baseline credit */}
        <div className="mt-16 border-t border-line-soft pt-8 text-xs text-muted">
          <p className="font-body">
            &copy; {year} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
