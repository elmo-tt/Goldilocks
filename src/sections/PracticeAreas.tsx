import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
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

  
  const [active2, setActive2] = useState(-1)
  const [emblaRef2, embla2] = useEmblaCarousel({ align: 'start', loop: false, dragFree: false, skipSnaps: false, slidesToScroll: 1 })
  const viewport2Ref = useRef<HTMLDivElement | null>(null)
  const setViewport2Ref = useCallback((node: HTMLDivElement | null) => {
    viewport2Ref.current = node
    // Forward to Embla's ref callback
    emblaRef2(node as unknown as HTMLElement)
  }, [emblaRef2])
  const wheelState2Ref = useRef<{ acc: number; lastDir: number; ts: number }>({ acc: 0, lastDir: 0, ts: 0 })

  const isSlideInView2 = (idx: number) => {
    if (!embla2 || !viewport2Ref.current) return false
    const viewportRect = viewport2Ref.current.getBoundingClientRect()
    const slide = embla2.slideNodes()[idx] as HTMLElement | undefined
    if (!slide) return false
    const r = slide.getBoundingClientRect()
    const pad = 1
    return r.left >= viewportRect.left - pad && r.right <= viewportRect.right + pad
  }

  const go2 = (dir: 1 | -1) => {
    if (!embla2) return
    const length = areas.length
    const base = active2 === -1 ? embla2.selectedScrollSnap() : active2
    const next = Math.max(0, Math.min(base + dir, length - 1))
    setActive2(next)
    if (!isSlideInView2(next)) embla2.scrollTo(next)
  }

  

  

  useEffect(() => {
    if (!embla2) return
    const onSelect = () => {
      // Sync active to Embla when user drags/swipes
      setActive2(embla2.selectedScrollSnap())
    }
    embla2.on('select', onSelect)
    embla2.on('reInit', onSelect)
    // Initialize to first slide for the test carousel
    embla2.scrollTo(0)
    setActive2(0)
    return () => {
      embla2.off('select', onSelect)
      embla2.off('reInit', onSelect)
    }
  }, [embla2])

  // No extra effects needed: Embla aligns snaps to the left (align: 'start') consistently

  return (
    <section id="practice-areas" className="practice">
      <div className="practice-inner">
        <div className="practice-left">
          <div className="eyebrow">PRACTICE AREAS</div>
          <h2 className="practice-title"><span>Experienced.</span><span>Relentless.</span><span>Results-Driven.</span></h2>
          <p className="practice-sub">Protecting your rights & securing maximum compensation.</p>
        </div>
        <div className="practice-right">
          <div className="pa2">
            <div
              className="pa2-viewport"
              ref={setViewport2Ref}
              tabIndex={0}
              onWheel={(e) => {
                if (!embla2) return
                e.preventDefault()
                const axis = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
                if (axis === 0) return
                const dir = axis > 0 ? 1 : -1
                const now = Date.now()
                const state = wheelState2Ref.current
                const cooldown = 220
                const threshold = 60
                if (state.lastDir !== dir) { state.acc = 0; state.lastDir = dir }
                if (now - state.ts < cooldown) return
                state.acc += Math.abs(axis)
                if (state.acc >= threshold) {
                  go2(dir as 1 | -1)
                  state.acc = 0
                  state.ts = now
                }
              }}
              onKeyDown={(e) => {
                if (!embla2) return
                if (e.key === 'ArrowRight') { e.preventDefault(); go2(1) }
                if (e.key === 'ArrowLeft')  { e.preventDefault(); go2(-1) }
              }}
            >
              <div className="pa2-track">
                {areas.map((a, i) => {
                  const isActive = i === active2
                  return (
                    <div
                      key={`test-${a.id}`}
                      className={`pa2-slide${isActive ? ' active' : ''}`}
                      onClick={() => {
                        setActive2(i)
                        if (embla2 && !isSlideInView2(i)) embla2.scrollTo(i)
                      }}
                    >
                      <div className="pa2-card">
                        <div className="pa2-inner">
                          <header className="pa2-header">{a.title}</header>
                          {!isActive && (
                            <div className="pa2-footer">
                              <div className="pa2-rate">{a.success}</div>
                              <div className="pa2-caption">success rate</div>
                            </div>
                          )}
                          {isActive && (
                            <div className="pa2-feature">
                              {a.image && <div className="pa2-feature-image" style={{ backgroundImage: `url(${a.image})` }} />}
                              <div className="pa2-feature-body">
                                {a.description && <p className="pa2-feature-text">{a.description}</p>}
                                <a className="pa2-feature-cta" href={a.href || '#'}>
                                  Learn more <span className="arrow">→</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="pa2-nav">
              <a className="view-all" href="#">View all</a>
              <div className="arrows">
                <button className="nav-btn" aria-label="Previous" onClick={() => go2(-1)}>←</button>
                <button className="nav-btn" aria-label="Next" onClick={() => go2(1)}>→</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
