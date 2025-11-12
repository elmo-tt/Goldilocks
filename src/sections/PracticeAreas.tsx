import { useMemo, useRef, useState, useEffect } from 'react'
import './PracticeAreas.css'

type Area = {
  id: string
  title: string
  success?: string
  description?: string
  href?: string
  image?: string
}

export default function PracticeAreas() {
  const areas: Area[] = useMemo(
    () => [
      { id: 'slip-fall', title: 'Slip & Fall', success: '94%', description: 'Slip and fall accidents and other injuries caused by premises liability issues can cause serious injuries, leaving victims stuck with significant medical expenses and losing income while they heal.', href: '#' },
      {
        id: 'vehicle-accident',
        title: 'Vehicle Accident',
        description: 'Injured in a car crash? We fight to get you the compensation you deserve.',
        success: '95%',
        href: '#',
        image: '/images/vehicle-accident.jpg'
      },
      { id: 'negligent-security', title: 'Negligent Security', success: '97%', description: 'Negligent security laws are designed to hold property owners liable for crimes that occur on their premises due to inadequate security measures.', href: '#' },
      { id: 'sexual-assault-human-trafficking', title: 'Sexual Assault and Human Trafficking', success: '98%' },
      { id: 'motorcycle-accident', title: 'Motorcycle Accident', success: '96%' },
      { id: 'wrongful-death', title: 'Wrongful Death', success: '93%', description: 'No one ever expects to suffer the sudden and unexpected loss of a loved one.', href: '#' },
    ],
    []
  )

  const [active, setActive] = useState(-1)
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollRaf = useRef<number | null>(null)

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const cards = track.querySelectorAll<HTMLElement>('.practice-card')
    const card = cards[idx]
    if (!card) return
    const isLast = idx === cards.length - 1
    // Request a UA snap first. Use end alignment for last card so previous cards remain visible.
    card.scrollIntoView({ behavior: 'smooth', inline: isLast ? 'end' : 'start', block: 'nearest' })
    // After a short delay, force exact left alignment if not already aligned
    window.setTimeout(() => {
      const desired = card.offsetLeft - track.offsetLeft
      const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth)
      // For last card, align its right edge to viewport right
      const desiredEnd = desired - (track.clientWidth - card.clientWidth)
      const targetLeft = isLast ? desiredEnd : desired
      const clamped = Math.max(0, Math.min(targetLeft, maxLeft))
      const delta = Math.abs(track.scrollLeft - clamped)
      if (delta > 1) track.scrollTo({ left: clamped, behavior: 'auto' })
    }, 220)
  }

  const go = (dir: 1 | -1) => {
    if (active === -1) {
      const first = dir === 1 ? 0 : areas.length - 1
      setActive(first)
      scrollToIndex(first)
      return
    }
    const next = (active + dir + areas.length) % areas.length
    scrollToIndex(next)
  }

  useEffect(() => {
    const root = trackRef.current
    if (!root) return
    const onScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
      scrollRaf.current = requestAnimationFrame(() => {
        const cards = root.querySelectorAll<HTMLElement>('.practice-card')
        if (!cards.length) return
        const viewportRect = root.getBoundingClientRect()
        const targetX = viewportRect.left
        const maxLeft = Math.max(0, root.scrollWidth - root.clientWidth)
        let nearest = 0
        let min = Number.POSITIVE_INFINITY
        cards.forEach((el, idx) => {
          const r = el.getBoundingClientRect()
          const d = Math.abs(r.left - targetX)
          if (d < min) { min = d; nearest = idx }
        })
        // If we're at the very end, force last as nearest so its details show
        if (Math.abs(root.scrollLeft - maxLeft) < 2) {
          nearest = cards.length - 1
        }
        if (nearest !== active) setActive(nearest)
      })
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => { root.removeEventListener('scroll', onScroll) }
  }, [active, areas.length])

  return (
    <section id="practice-areas" className="practice">
      <div className="practice-inner">
        <div className="practice-left">
          <div className="eyebrow">PRACTICE AREAS</div>
          <h2 className="practice-title"><span>Experienced.</span><span>Relentless.</span><span>Results-Driven.</span></h2>
          <p className="practice-sub">Protecting your rights & securing maximum compensation.</p>
        </div>
        <div className="practice-right">
          <div className="cards-viewport" ref={trackRef}>
            {areas.map((a, i) => {
              const isActive = i === active
              return (
                <article
                  key={a.id}
                  className={`practice-card${isActive ? ' active' : ''}`}
                  onClick={() => {
                    scrollToIndex(i)
                  }}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <div className="card-inner">
                    <header className="card-header">{a.title}</header>
                    {!isActive && (
                      <div className="card-footer">
                        <div className="rate">{a.success}</div>
                        <div className="caption">success rate</div>
                      </div>
                    )}
                    {isActive && (
                      <div className="card-feature">
                        {a.image && <div className="feature-image" style={{ backgroundImage: `url(${a.image})` }} />}
                        <div className="feature-body">
                          <p className="feature-text">{a.description}</p>
                          <a className="feature-cta" href={a.href || '#'}>
                            Learn more <span className="arrow">→</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
          <div className="practice-nav">
            <a className="view-all" href="#">View all</a>
            <div className="arrows">
              <button className="nav-btn" aria-label="Previous" onClick={() => go(-1)}>
                ←
              </button>
              <button className="nav-btn" aria-label="Next" onClick={() => go(1)}>
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
