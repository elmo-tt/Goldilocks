import { useEffect, useMemo, useRef, useState } from 'react'
import './PracticeWelcomeVideo.css'

export default function PracticeWelcomeVideo({
  videoId,
  placeholderSrc,
  title = 'Welcome video',
}: {
  videoId: string
  placeholderSrc: string
  title?: string
}) {
  const [playing, setPlaying] = useState(false)
  const playerRef = useRef<any>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const playerId = useMemo(() => 'yt_' + Math.random().toString(36).slice(2), [])
  const useDirectEmbed = true

  // Preload YouTube iframe API on mount for instant play
  useEffect(() => {
    const w = window as any
    if (w.YT && w.YT.Player) return
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
    }
    return () => {
      // Keep API loaded for future navigations; no cleanup needed
    }
  }, [])

  // When playing, instantiate player and handle end -> revert to placeholder
  useEffect(() => {
    const w = window as any
    if (!playing || useDirectEmbed) return
    if (!(w.YT && w.YT.Player)) return
    const YT = w.YT
    playerRef.current = new YT.Player(playerId, {
      videoId,
      playerVars: {
        autoplay: 1,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
      },
      events: {
        onReady: (e: any) => {
          try { e.target.playVideo() } catch {}
          try {
            const el = wrapRef.current
            if (el) {
              try { el.style.setProperty('width', '100%', 'important') } catch {}
              try { el.style.setProperty('max-width', '100%', 'important') } catch {}
            }
            // Force iframe to fill container regardless of injected inline sizes
            const ifr = e?.target?.getIframe?.()
            if (ifr) {
              ifr.style.position = 'absolute'
              ifr.style.inset = '0'
              ifr.style.width = '100%'
              ifr.style.height = '100%'
              ifr.style.border = '0'
            }
          } catch {}
        },
        onStateChange: (e: any) => {
          if (e.data === YT.PlayerState.ENDED) {
            try { playerRef.current?.stopVideo?.() } catch {}
            try { playerRef.current?.destroy?.() } catch {}
            playerRef.current = null
            setPlaying(false)
          }
        },
      },
    })
    return () => {
      try { playerRef.current?.destroy?.() } catch {}
      playerRef.current = null
    }
  }, [playing, videoId, playerId, useDirectEmbed])

  // Keep player sized to wrapper on resize/rotation/layout changes
  useEffect(() => {
    if (!playing) return
    const el = wrapRef.current
    if (!el) return
    let raf = 0
    // Ensure wrapper never keeps an inline width; remove it so CSS can control
    try {
      el.style.removeProperty('width')
    } catch {}
    const resize = () => {
      try {
        const p: any = playerRef.current
        if (p && el) {
          const { clientWidth: w, clientHeight: h } = el
          if (w && h) p.setSize(w, h)
        }
      } catch {}
    }
    const RO = (window as any).ResizeObserver as any
    const ro = RO ? new RO(() => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(resize)
    }) : null
    try { ro && ro.observe && ro.observe(el) } catch {}
    const onWin = () => { if (raf) cancelAnimationFrame(raf); raf = requestAnimationFrame(resize) }
    window.addEventListener('resize', onWin)
    window.addEventListener('orientationchange', onWin)
    // If any script injects inline width on wrapper, remove it
    const mo = new MutationObserver((recs) => {
      for (const r of recs) {
        if (r.type === 'attributes' && r.attributeName === 'style') {
          try {
            if (el.style.width) el.style.removeProperty('width')
          } catch {}
        }
      }
    })
    try { mo.observe(el, { attributes: true, attributeFilter: ['style'] }) } catch {}
    // Kick once after mount
    raf = requestAnimationFrame(resize)
    return () => {
      try { ro && ro.disconnect && ro.disconnect() } catch {}
      try { mo.disconnect() } catch {}
      window.removeEventListener('resize', onWin)
      window.removeEventListener('orientationchange', onWin)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [playing])

  const start = () => {
    // Ensure API is ready, then start
    if ((window as any).YT && (window as any).YT.Player) {
      setPlaying(true)
    } else {
      // slight delay to allow API to finish loading
      const iv = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          clearInterval(iv)
          setPlaying(true)
        }
      }, 50)
      setTimeout(() => clearInterval(iv), 4000)
    }
  }

  return (
    <section className="pa-welcome">
      <div className="video-shell">
        {!playing && (
          <>
            <img className="ph" src={placeholderSrc} alt={title} />
            <button className="play" type="button" aria-label="Play welcome video" onClick={start}>
              <svg viewBox="0 0 48 48" width="28" height="28" aria-hidden="true" focusable="false">
                <path fill="#fff" d="M19 16l14 8-14 8z"/>
              </svg>
            </button>
          </>
        )}
        {playing && (
          <div className="yt-wrap" aria-label={title} ref={wrapRef}>
            {useDirectEmbed ? (
              <iframe
                className="yt"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            ) : (
              <div id={playerId} className="yt" />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
