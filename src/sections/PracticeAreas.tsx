import { useMemo, useRef, useState } from 'react'
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

  const [active, setActive] = useState(1)
  const trackRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelectorAll<HTMLElement>('.practice-card')[idx]
    if (!card) return
    card.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }

  const go = (dir: 1 | -1) => {
    const next = (active + dir + areas.length) % areas.length
    setActive(next)
    scrollToIndex(next)
  }

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
                    setActive(i)
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
