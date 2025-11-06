import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
    } catch {}
  }, [])

  useEffect(() => {
    let cancelled = false

    const scrollTop = () => {
      if (cancelled) return
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }

    const tryHash = () => {
      if (!hash) return false
      const el = document.querySelector(hash) as HTMLElement | null
      if (el && typeof (el as any).scrollIntoView === 'function') {
        el.scrollIntoView({ block: 'start' })
        return true
      }
      return false
    }

    if (hash) {
      let tries = 0
      const tick = () => {
        if (cancelled) return
        if (tryHash()) return
        if (tries++ < 6) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      return () => { cancelled = true }
    }

    requestAnimationFrame(() => {
      if (cancelled) return
      scrollTop()
      requestAnimationFrame(() => {
        if (cancelled) return
        scrollTop()
        setTimeout(() => { if (!cancelled) scrollTop() }, 50)
      })
    })

    return () => { cancelled = true }
  }, [pathname, hash])

  return null
}
