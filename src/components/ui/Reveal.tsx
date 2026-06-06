import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'

export interface RevealProps {
  /** Element type to render (default 'div'). */
  as?: ElementType
  className?: string
  /** Delay before the reveal transition, in seconds. */
  delay?: number
  /** Distance (px) the content lifts from when revealing. */
  y?: number
  /** Reveal only the first time it enters view (default true). */
  once?: boolean
  children?: ReactNode
}

/**
 * Fades + lifts its children when scrolled into view.
 *
 * SSR / no-JS friendly: the start (hidden) state is only applied AFTER the
 * component mounts on the client, so server markup ships fully visible — no
 * FOUC, no content hidden from crawlers or users without JS. Honours
 * prefers-reduced-motion by showing instantly.
 */
export default function Reveal({
  as,
  className,
  delay = 0,
  y = 24,
  once = true,
  children,
}: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  // Gate the hidden start-state behind mount so SSR output stays visible.
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisible(true)
      return
    }

    setMounted(true)

    const node = ref.current
    if (!node) {
      setVisible(true)
      return
    }

    if (!('IntersectionObserver' in window)) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setVisible(false)
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once])

  // Hidden only while mounted on the client and not yet in view.
  const hidden = mounted && !visible

  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? `translateY(${y}px)` : 'translateY(0)',
        transition: mounted
          ? `opacity 0.9s var(--ease-out-expo) ${delay}s, transform 0.9s var(--ease-out-expo) ${delay}s`
          : undefined,
        willChange: hidden ? 'opacity, transform' : undefined,
      }}
    >
      {children}
    </Tag>
  )
}
