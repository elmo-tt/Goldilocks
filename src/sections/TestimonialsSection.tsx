import { useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
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

  // Old custom carousel removed
  // Looping Embla instance (demo-style: selected index, scroll snaps, prev/next disabled)
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: 'center', skipSnaps: false, slidesToScroll: 1 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  useEffect(() => {
    if (!embla) return
    const onSelect = () => {
      setSelectedIndex(embla.selectedScrollSnap())
    }
    setScrollSnaps(embla.scrollSnapList())
    onSelect()
    embla.on('select', onSelect)
    embla.on('reInit', () => { setScrollSnaps(embla.scrollSnapList()); onSelect() })
    return () => { embla.off('select', onSelect) }
  }, [embla])

  const emblaTotal = scrollSnaps.length || testimonials.length
  const ratio = emblaTotal > 1 ? selectedIndex / (emblaTotal - 1) : 0

  return (
    <section id="testimonials" className="home-testimonials">
      <div className="testimonials-inner">
        <div className="embla">
          <div className="embla__viewport" ref={emblaRef}>
            <div className="embla__container">
              {testimonials.map((t, i) => (
                <div className={`embla__slide${i === selectedIndex ? ' embla__slide--selected' : ''}`} key={`loop2-${t.id}`} onClick={() => embla?.scrollTo(i)}>
                  <div className="embla__slide__card">
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="t-controls">
          <div
            className="progress"
            role="progressbar"
            aria-label="Testimonials"
            aria-valuemin={0}
            aria-valuemax={emblaTotal - 1}
            aria-valuenow={selectedIndex}
            style={{ ['--segments' as any]: emblaTotal }}
          >
            <span className="thumb" style={{ ['--progress' as any]: ratio }} />
          </div>
          <div className="t-arrows">
            <button className="t-nav-btn" aria-label="Previous" onClick={() => { if (embla && emblaTotal) embla.scrollTo((selectedIndex - 1 + emblaTotal) % emblaTotal) }}>←</button>
            <button className="t-nav-btn" aria-label="Next" onClick={() => { if (embla && emblaTotal) embla.scrollTo((selectedIndex + 1) % emblaTotal) }}>→</button>
          </div>
        </div>
        {/* Removed the duplicate Embla block below; original controls drive Embla above */}
      </div>
    </section>
  )
}
