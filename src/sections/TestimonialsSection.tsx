import { useEffect, useMemo, useRef, useState } from 'react'
import './TestimonialsSection.css'

type Testimonial = {
  id: string
  rating: number
  text: string
  name: string
  area: string
}

export default function TestimonialsSection() {
  const testimonials: Testimonial[] = useMemo(
    () => [
      {
        id: 't1',
        rating: 5,
        text:
          'When you need an attorney that truly cares, GOLDLAW is the firm to call. My attorney, Paul Shalhoub, is outstanding! He is so pleasant to talk to, always smiling and on point when it came to my case. He will fight for you until he feels the outcome is what you deserve. What a wonderful experience. At GOLDLAW, you are treated like family! Thank you, Paul, and the entire team. Outstanding!',
        name: 'Karen R.',
        area: 'Auto Accident',
      },
      {
        id: 't2',
        rating: 5,
        text:
          'GOLDLAW handled my case with professionalism and compassion. Communication was clear and I always knew what to expect. Highly recommend the team!',
        name: 'Jason M.',
        area: 'Premises Liability',
      },
      {
        id: 't3',
        rating: 5,
        text:
          'From start to finish, they fought hard and got a result beyond what I imagined. They truly put clients first.',
        name: 'Alyssa P.',
        area: 'Negligent Security',
      },
      {
        id: 't4',
        rating: 4,
        text:
          'Professional, responsive, and effective. I felt supported every step of the way.',
        name: 'David H.',
        area: 'Motorcycle Accident',
      },
    ],
    []
  )

  const [active, setActive] = useState(0) // index within original testimonials
  const [focusLoopIdx, setFocusLoopIdx] = useState(1) // loop index visually focused
  const scrollRaf = useRef<number | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(3)
  const total = testimonials.length
  const clones = visibleCount > 1 ? Math.max(1, visibleCount) : 0
  const loopIndexForOriginal = (origIdx: number) => origIdx + clones
  const originalFromLoopIndex = (loopIdx: number) => ((loopIdx - clones) % total + total) % total
  const looped = useMemo(() => {
    if (!total) return [] as Testimonial[]
    if (clones <= 0) return testimonials
    const lc = clones
    const left = testimonials.slice(-lc).map((t, i) => ({ ...t, id: `${t.id}-lc${i}` }))
    const right = testimonials.slice(0, lc).map((t, i) => ({ ...t, id: `${t.id}-rc${i}` }))
    return [...left, ...testimonials, ...right]
  }, [testimonials, total, clones])
  const ratio = total > 1 ? active / (total - 1) : 0


  const scrollToIndex = (loopIdx: number, behavior: ScrollBehavior = 'smooth') => {
    const root = trackRef.current
    if (!root) return
    const cards = root.querySelectorAll<HTMLElement>('.t-card')
    const el = cards[loopIdx]
    if (!el) return
    // Let the browser perform a snap-centered scroll reliably
    el.scrollIntoView({ behavior, inline: 'center', block: 'nearest' })
  }

  const go = (dir: 1 | -1) => {
    if (clones > 0) {
      const targetLoop = focusLoopIdx + dir
      scrollToIndex(targetLoop, 'smooth')
    } else {
      const next = Math.max(0, Math.min(total - 1, focusLoopIdx + dir))
      if (next === focusLoopIdx) return
      scrollToIndex(next, 'smooth')
    }
  }

  useEffect(() => {
    // responsive visible count (3 desktop, 1 mobile)
    const mq = window.matchMedia('(max-width: 900px)')
    const apply = () => setVisibleCount(mq.matches ? 1 : 3)
    apply()
    const listener = () => apply()
    if (mq.addEventListener) mq.addEventListener('change', listener)
    else mq.addListener(listener)

    const initial = loopIndexForOriginal(active)
    setFocusLoopIdx(initial)
    scrollToIndex(initial, 'auto')

    const onScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
      scrollRaf.current = requestAnimationFrame(() => {
        const root = trackRef.current
        if (!root) return
        const cards = root.querySelectorAll<HTMLElement>('.t-card')
        if (!cards.length) return
        const viewportRect = root.getBoundingClientRect()
        const centerX = viewportRect.left + viewportRect.width / 2
        let nearest = 0
        let min = Number.POSITIVE_INFINITY
        cards.forEach((el, idx) => {
          const r = el.getBoundingClientRect()
          const cx = r.left + r.width / 2
          const d = Math.abs(cx - centerX)
          if (d < min) { min = d; nearest = idx }
        })

        // If a clone region is centered, reposition seamlessly to the matching original
        if (nearest < clones || nearest >= clones + total) {
          const root = trackRef.current
          if (!root) return
          const orig = originalFromLoopIndex(nearest)
          const origLoop = loopIndexForOriginal(orig)
          const cardsAll = root.querySelectorAll<HTMLElement>('.t-card')
          const cloneEl = cardsAll[nearest]
          const origEl = cardsAll[origLoop]
          if (!cloneEl || !origEl) return
          // shift scrollLeft by the delta between original and clone so visual center stays identical
          const delta = origEl.offsetLeft - cloneEl.offsetLeft
          root.scrollTo({ left: root.scrollLeft + delta, behavior: 'auto' })
          // Defer state changes to next frame so the shift completes without visible flicker
          requestAnimationFrame(() => {
            setFocusLoopIdx(origLoop)
            if (active !== orig) setActive(orig)
          })
          return
        }

        setFocusLoopIdx(nearest)
        const orig = originalFromLoopIndex(nearest)
        if (orig !== active) setActive(orig)
      })
    }

    const root = trackRef.current
    root?.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      root?.removeEventListener('scroll', onScroll)
      if (mq.removeEventListener) mq.removeEventListener('change', listener)
      else mq.removeListener(listener)
    }
  }, [total, active, clones])

  return (
    <section id="testimonials" className="home-testimonials">
      <div className="testimonials-inner">
        <div className="t-viewport-wrap">
          <div className="t-viewport" ref={trackRef}>
            {looped.map((t, i) => (
              <article
                key={t.id}
                className={`t-card${i === focusLoopIdx ? ' active' : ''}`}
                onClick={() => {
                  // Scroll directly to the clicked loop index (may be a clone)
                  scrollToIndex(i, 'smooth')
                }}
                aria-current={i === focusLoopIdx ? 'true' : undefined}
              >
                <div className="stars" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <span key={s} className={`star${s < t.rating ? ' on' : ''}`}>★</span>
                  ))}
                </div>
                <blockquote className="t-text">“{t.text}”</blockquote>
                <footer className="t-meta">
                  <div className="name">{t.name}</div>
                  <div className="area">{t.area}</div>
                </footer>
              </article>
            ))}
          </div>
        </div>

        <div className="t-controls">
          <div
            className="progress"
            role="progressbar"
            aria-label="Testimonials"
            aria-valuemin={0}
            aria-valuemax={total - 1}
            aria-valuenow={active}
            style={{ ['--segments' as any]: total }}
          >
            <span className="thumb" style={{ ['--progress' as any]: ratio }} />
          </div>
          <div className="t-arrows">
            <button className="t-nav-btn" aria-label="Previous" onClick={() => go(-1)}>←</button>
            <button className="t-nav-btn" aria-label="Next" onClick={() => go(1)}>→</button>
          </div>
        </div>
      </div>
    </section>
  )
}
