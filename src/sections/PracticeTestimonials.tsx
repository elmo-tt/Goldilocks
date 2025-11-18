import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import useEmblaCarousel from 'embla-carousel-react'
import './PracticeTestimonials.css'

type Testimonial = {
  id: string
  name: string
  area: string
  settlement?: string
  image?: string
  poster?: string
  href?: string
  src?: string
  captureAt?: number
}

export default function PracticeTestimonials({ folder, title }: { folder: string; title?: string }) {
  const { t } = useTranslation()
  const [items, setItems] = useState<Testimonial[]>([])
  const [playing, setPlaying] = useState<Testimonial | null>(null)
  const [posters, setPosters] = useState<Record<string, string>>({})
  const generatingRef = useRef<Record<string, boolean>>({})
  useEffect(() => {
    const url = `/videos/testimonials/${folder}/manifest.json`
    fetch(url)
      .then(r => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setItems(data)
      })
      .catch(() => {})
  }, [folder])

  
  const [emblaRef, embla] = useEmblaCarousel({ loop: true, align: 'start', skipSnaps: false, containScroll: 'trimSnaps', slidesToScroll: 1 })
  const [selectedIndex, setSelectedIndex] = useState(0)
  useEffect(() => {
    if (!embla) return
    const onSelect = () => { setSelectedIndex(embla.selectedScrollSnap()) }
    onSelect()
    embla.on('select', onSelect)
    embla.on('reInit', () => { onSelect() })
    return () => { embla.off('select', onSelect) }
  }, [embla])

  

  
  const prevEmbla = () => { embla?.scrollPrev() }
  const nextEmbla = () => { embla?.scrollNext() }

  // Dynamic poster capture for items lacking poster/image; default 5s, per-item override via captureAt
  const ensurePoster = async (it: Testimonial) => {
    if (!it || it.image || it.poster || !it.src) return
    const captureAt = Number.isFinite(it.captureAt as number) ? Math.max(0.1, Math.min(60, Number(it.captureAt))) : 5
    const key = `pa_tst_poster:${it.src}@${captureAt}`
    const cached = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    if (cached) {
      if (posters[it.id] !== cached) setPosters(p => ({ ...p, [it.id]: cached }))
      return
    }
    if (generatingRef.current[it.id]) return
    generatingRef.current[it.id] = true
    const t0 = performance.now()
    try {
      const vid = document.createElement('video')
      vid.src = it.src!
      vid.crossOrigin = 'anonymous'
      vid.preload = 'metadata'
      vid.muted = true
      await new Promise<void>((resolve, reject) => {
        const onLoaded = () => resolve()
        const onError = () => reject(new Error('video load error'))
        vid.addEventListener('loadedmetadata', onLoaded, { once: true })
        vid.addEventListener('error', onError, { once: true })
      })
      const target = Math.min(captureAt, Math.max(0.1, (vid.duration || captureAt + 1) - 0.1))
      await new Promise<void>((resolve) => {
        const onSeeked = () => resolve()
        vid.currentTime = target
        vid.addEventListener('seeked', onSeeked, { once: true })
      })
      const w = vid.videoWidth || 1280
      const h = vid.videoHeight || 720
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(vid, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
      setPosters(p => ({ ...p, [it.id]: dataUrl }))
      try { window.localStorage.setItem(key, dataUrl) } catch {}
      const dt = Math.round(performance.now() - t0)
      console.log(`[Testimonials] Poster generated at ${captureAt}s for ${it.id} in ${dt}ms`)
    } catch (_) {
      // ignore
    } finally {
      generatingRef.current[it.id] = false
    }
  }

  // Pre-generate posters for the first 4 items on initial load so placeholders appear immediately
  useEffect(() => {
    if (!items.length) return
    const count = Math.min(4, items.length)
    for (let i = 0; i < count; i++) ensurePoster(items[i])
  }, [items])

  useEffect(() => {
    if (!items.length) return
    const targets: Testimonial[] = []
    if (items[selectedIndex]) targets.push(items[selectedIndex])
    if (items[selectedIndex + 1]) targets.push(items[selectedIndex + 1])
    if (items[selectedIndex - 1]) targets.push(items[selectedIndex - 1])
    targets.forEach(t => { ensurePoster(t) })
  }, [items, selectedIndex])

  

  


  return (
    <section className="testimonials">
      <div className="t-inner">
        <div className="t-left">
          <h2 className="t-title">{title ?? t('practice_testimonials.title')}</h2>
          <div className="t-arrows">
            <button className="nav-btn" aria-label="Previous" onClick={prevEmbla}>←</button>
            <button className="nav-btn" aria-label="Next" onClick={nextEmbla}>→</button>
          </div>
        </div>
        <div className="t-right">
          <div className="pt-embla">
            <div className="pt-embla__viewport" ref={emblaRef}>
              <div className="pt-embla__container">
                {items.map((it, i) => (
                  <div className="pt-embla__slide" key={`embla-${it.id}`}>
                    <article
                      className={`t-card${i === selectedIndex ? ' active' : ''}`}
                      aria-current={i === selectedIndex ? 'true' : undefined}
                      onClick={() => embla?.scrollTo(i)}
                    >
                      <div
                        className="t-thumb"
                        style={(it.image || it.poster || posters[it.id]) ? { backgroundImage: `url(${it.image || it.poster || posters[it.id]})` } : undefined}
                      >
                        {it.settlement && <div className="pill">{it.settlement}</div>}
                        <button
                          className="play"
                          aria-label={`Play ${it.name}'s story`}
                          onClick={(e) => { e.stopPropagation(); setPlaying(it) }}
                        >
                          <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#0a0d48" d="M19 16l14 8-14 8z"/></svg>
                        </button>
                      </div>
                      <footer className="t-meta">
                        <div className="t-name">{it.name}</div>
                        <div className="t-area">{it.area}</div>
                      </footer>
                    </article>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {playing && (
          <div className="t-modal" role="dialog" aria-modal="true" onClick={() => setPlaying(null)}>
            <div className="t-modal-inner" onClick={(e) => e.stopPropagation()}>
              <video src={playing.src} controls autoPlay playsInline />
              <button className="t-close" aria-label="Close" onClick={() => setPlaying(null)}>✕</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
