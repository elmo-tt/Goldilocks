import { useEffect, useRef, useState } from 'react'
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

export default function PracticeTestimonials({ folder, title = 'Hear the stories our clients have had' }: { folder: string; title?: string }) {
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

  const [active, setActive] = useState(0)
  const trackRef = useRef<HTMLDivElement>(null)
  const scrollRaf = useRef<number | null>(null)

  const scrollToIndex = (idx: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelectorAll<HTMLElement>('.t-card')[idx]
    if (!card) return
    const cards = track.querySelectorAll<HTMLElement>('.t-card')
    const isLast = idx === cards.length - 1
    card.scrollIntoView({ inline: isLast ? 'end' : 'start', block: 'nearest', behavior: 'smooth' })
    // After a short delay, force precise alignment in case UA snap stops slightly off
    window.setTimeout(() => {
      const desiredStart = card.offsetLeft - track.offsetLeft
      const maxLeft = Math.max(0, track.scrollWidth - track.clientWidth)
      const desiredEnd = desiredStart - (track.clientWidth - card.clientWidth)
      const targetLeft = isLast ? desiredEnd : desiredStart
      const clamped = Math.max(0, Math.min(targetLeft, maxLeft))
      if (Math.abs(track.scrollLeft - clamped) > 1) track.scrollTo({ left: clamped, behavior: 'auto' })
    }, 220)
  }

  const go = (dir: 1 | -1) => {
    const next = (active + dir + items.length) % items.length
    setActive(next)
    scrollToIndex(next)
  }

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
    if (items[active]) targets.push(items[active])
    if (items[active + 1]) targets.push(items[active + 1])
    if (items[active - 1]) targets.push(items[active - 1])
    targets.forEach(t => { ensurePoster(t) })
  }, [items, active])

  useEffect(() => {
    const root = trackRef.current
    if (!root) return
    const onScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current)
      scrollRaf.current = requestAnimationFrame(() => {
        const cards = root.querySelectorAll<HTMLElement>('.t-card')
        if (!cards.length) return
        const viewportRect = root.getBoundingClientRect()
        const rootStyle = getComputedStyle(root)
        const padLeftStr = rootStyle.getPropertyValue('scroll-padding-left') || '0'
        let padLeft = parseFloat(padLeftStr) || 0
        // Fallback: use card scroll-margin-left if scroll-padding-left is not available
        const cardsArr = Array.from(cards)
        if (!padLeft && cardsArr.length) {
          const cs0 = getComputedStyle(cardsArr[0])
          padLeft = parseFloat(cs0.getPropertyValue('scroll-margin-left') || '0') || 0
        }
        const targetX = viewportRect.left + padLeft
        const maxLeft = Math.max(0, root.scrollWidth - root.clientWidth)
        let nearest = 0
        let min = Number.POSITIVE_INFINITY
        const marginLeft = (() => {
          if (!cardsArr.length) return 0
          const cs = getComputedStyle(cardsArr[0])
          return parseFloat(cs.getPropertyValue('scroll-margin-left') || '0') || 0
        })()
        cards.forEach((el, idx) => {
          const r = el.getBoundingClientRect()
          // Logical left = visual left minus the scroll-margin-left applied for snapping
          const logicalLeft = r.left - marginLeft
          const d = Math.abs(logicalLeft - targetX)
          if (d < min) { min = d; nearest = idx }
        })
        // If scrolled to the very end, force last card as active so it is reachable both by swipe and back arrow
        if (Math.abs(root.scrollLeft - maxLeft) < 2) {
          nearest = cards.length - 1
        }
        if (nearest !== active) setActive(nearest)
      })
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => { root.removeEventListener('scroll', onScroll) }
  }, [active, items.length])

  


  return (
    <section className="testimonials">
      <div className="t-inner">
        <div className="t-left">
          <h2 className="t-title">{title}</h2>
          <div className="t-arrows">
            <button className="nav-btn" aria-label="Previous" onClick={() => go(-1)}>←</button>
            <button className="nav-btn" aria-label="Next" onClick={() => go(1)}>→</button>
          </div>
        </div>
        <div className="t-right">
          <div className="t-viewport" ref={trackRef}>
            {items.map((it, i) => (
              <article
                className={`t-card${i === active ? ' active' : ''}`}
                key={it.id}
                aria-current={i === active ? 'true' : undefined}
                onClick={() => {
                  setActive(i)
                  scrollToIndex(i)
                }}
              >
                <div className="t-thumb" style={(it.image || it.poster || posters[it.id]) ? { backgroundImage: `url(${it.image || it.poster || posters[it.id]})` } : undefined}>
                  {it.settlement && <div className="pill">{it.settlement}</div>}
                  <button className="play" aria-label={`Play ${it.name}'s story`} onClick={(e) => { e.stopPropagation(); setPlaying(it) }}>
                    <svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><path fill="#0a0d48" d="M19 16l14 8-14 8z"/></svg>
                  </button>
                </div>
                <footer className="t-meta">
                  <div className="t-name">{it.name}</div>
                  <div className="t-area">{it.area}</div>
                </footer>
              </article>
            ))}
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
