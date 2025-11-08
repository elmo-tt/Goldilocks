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
  const playerId = useMemo(() => 'yt_' + Math.random().toString(36).slice(2), [])

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
    if (!playing) return
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
  }, [playing, videoId, playerId])

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
          <div className="yt-wrap" aria-label={title}>
            <div id={playerId} className="yt" />
          </div>
        )}
      </div>
    </section>
  )
}
