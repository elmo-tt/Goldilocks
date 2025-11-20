import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  const prevPathRef = useRef(pathname)
  const prevHashRef = useRef(hash)
  const isFirstLoadRef = useRef(true)

  useLayoutEffect(() => {
    try {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual'
      }
    } catch {}
  }, [])

  useLayoutEffect(() => {
    let cancelled = false
    const pathChanged = pathname !== prevPathRef.current
    const hashChanged = hash !== prevHashRef.current
    prevPathRef.current = pathname
    prevHashRef.current = hash

    const scrollTop = () => {
      if (cancelled) return
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        ;(document.scrollingElement || document.documentElement).scrollTop = 0
        document.body.scrollTop = 0
      } catch {}
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
        if (tries++ < 12) {
          requestAnimationFrame(tick)
        } else {
          // Fallback: force top if anchor never appeared
          let kicks = 0
          const kick = () => {
            if (cancelled) return
            scrollTop()
            if (kicks++ < 6) requestAnimationFrame(kick)
          }
          requestAnimationFrame(kick)
          setTimeout(() => { if (!cancelled) scrollTop() }, 150)
        }
      }
      requestAnimationFrame(tick)
      // Any hash-based navigation counts as having completed the first load
      isFirstLoadRef.current = false
      return () => { cancelled = true }
    }

    // Only force top when the pathname actually changed.
    if (pathChanged) {
      let tries = 0
      const tick = () => {
        if (cancelled) return
        scrollTop()
        if (tries++ < 8) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      setTimeout(() => { if (!cancelled) scrollTop() }, 120)
      isFirstLoadRef.current = false
    } else if (isFirstLoadRef.current && !hash && !hashChanged) {
      // Initial load on same path with no hash. Ensure we start at the very top only once.
      let tries = 0
      const tick = () => {
        if (cancelled) return
        scrollTop()
        if (tries++ < 6) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
      setTimeout(() => { if (!cancelled) scrollTop() }, 150)
      isFirstLoadRef.current = false
    }

    return () => { cancelled = true }
  }, [pathname, hash])

  return null
}
