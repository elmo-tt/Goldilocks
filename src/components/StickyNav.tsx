import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './StickyNav.css'

export default function StickyNav() {
  const [scrolled, setScrolled] = useState(false)
  const [showTopbar, setShowTopbar] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const hero = document.getElementById('hero')
    if (!hero) { setShowTopbar(false); return }
    const io = new IntersectionObserver(([entry]) => {
      setShowTopbar(entry.isIntersecting)
    }, { threshold: 0 })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const AUTH_KEY = 'gl_auth'
    try { setAuthed(!!localStorage.getItem(AUTH_KEY)) } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) setAuthed(!!e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <nav className={`sticky-nav${scrolled ? ' scrolled' : ''}${showTopbar ? '' : ' hide-topbar'}`}>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="topbar-left">
            <span className="loc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
              <span>Port St. Lucie, FL 34986</span>
            </span>
            <span className="sep">•</span>
            <span className="loc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
              <span>West Palm Beach, FL 33409</span>
            </span>
          </div>
          <div className="topbar-right">
            <a className="phone" href="tel:15612222222">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l1.82-1.82a1 1 0 011.01-.24 11.72 11.72 0 003.68.59 1 1 0 011 1v2.5a1 1 0 01-1 1C10.07 20.42 3.58 13.93 2 5.7a1 1 0 011-1h2.5a1 1 0 011 1c.04 1.27.25 2.49.59 3.68a1 1 0 01-.24 1.01l-1.82 1.82z"/></svg>
              <span>561.222.2222</span>
            </a>
          </div>
        </div>
      </div>
      <div className="navbar">
        <div className="inner">
          <Link className="brand" to="/" aria-label="GOLDLAW home">
            <img className="logo" src="/SVG/GOLDLAW_logo.svg" alt="GOLDLAW" />
          </Link>
          <ul className="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#team">Team</a></li>
            <li><Link to="/articles">Articles</Link></li>
            <li><a href="#contact">Contact</a></li>
            <li>
              <Link to={authed ? '/admin' : '/login'}>{authed ? 'Admin' : 'Login'}</Link>
            </li>
          </ul>
          <button
            className={`menu-toggle${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="icon icon-menu" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <svg className="icon icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <ul>
          <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
          <li><a href="#services" onClick={() => setMenuOpen(false)}>Services</a></li>
          <li><a href="#team" onClick={() => setMenuOpen(false)}>Team</a></li>
          <li><Link to="/articles" onClick={() => setMenuOpen(false)}>Articles</Link></li>
          <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
          <li>
            <Link to={authed ? '/admin' : '/login'} onClick={() => setMenuOpen(false)}>
              {authed ? 'Admin' : 'Login'}
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}
