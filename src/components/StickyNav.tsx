import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PRACTICE_AREAS } from '@/admin/data/goldlaw'
import { PRACTICE_AREAS_MAP } from '@/pages/practice/areas'
import './StickyNav.css'

const ABOUT_LINKS = [
  { label: 'Team', to: '/team', active: true },
  { label: 'Testimonials', to: '/about/testimonials', active: false },
  { label: 'Careers', to: '/about/careers', active: false },
  { label: 'Community Events', to: '/about/community-events', active: false },
  { label: 'Press Releases', to: '/about/press', active: false },
  { label: 'Promos and Incentives', to: '/about/promos-and-incentives', active: true },
  { label: 'Newsletters', to: '/about/newsletters', active: false },
  { label: 'FAQ', to: '/about/faq', active: false },
  { label: '7 Big Reasons to Refer PI Cases to GOLDLAW', to: '/about/7-reasons-to-refer', active: false },
  { label: 'Product Recalls', to: '/about/product-recalls', active: false },
]

export default function StickyNav() {
  // i18n: expose t() and current language
  const { t, i18n } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [showTopbar, setShowTopbar] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [mAboutOpen, setMAboutOpen] = useState(false)
  const [mCasesOpen, setMCasesOpen] = useState(false)

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
            <span className="sep">•</span>
            <span className="loc">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
              <span>Belle Glade, FL 33430</span>
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
          <div className="left">
            <Link className="brand" to="/" aria-label="GOLDLAW home">
              <img className="logo" src="/SVG/GOLDLAW_logo.svg" alt="GOLDLAW" width={160} height={32} />
            </Link>
            <ul className="nav-links">
              <li className="has-dropdown">
                <Link to="/#about">{t('nav.about')}
                  <svg className="caret" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
                </Link>
                <div className="dropdown wide">
                  <ul>
                    {ABOUT_LINKS.map((it) => (
                      <li key={it.to}>
                        {it.active ? (
                          <Link to={it.to}>{it.label}</Link>
                        ) : (
                          <span className="nav-link-disabled">{it.label}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
              <li className="has-dropdown">
                <Link to="/#services">{t('nav.cases')}
                  <svg className="caret" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
                </Link>
                <div className="dropdown wide">
                  <ul>
                    {PRACTICE_AREAS.map((pa) => {
                      const KEY_ALIASES: Record<string, string> = { car: 'car-accidents' }
                      const internalKey = (KEY_ALIASES[pa.key] ?? pa.key) as keyof typeof PRACTICE_AREAS_MAP
                      const isInternal = !!PRACTICE_AREAS_MAP[internalKey]
                      const href = isInternal ? `/practice/${internalKey}` : pa.url
                      return (
                        <li key={pa.key}>
                          {isInternal ? (
                            <Link to={href}>{pa.label}</Link>
                          ) : (
                            <a href={href} target="_blank" rel="noopener noreferrer">{pa.label}</a>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </li>
              <li><Link to="/articles#hero">{t('nav.blog')}</Link></li>
              <li><Link to="/contact">{t('nav.contact')}</Link></li>
              <li>
                <Link to={authed ? '/admin' : '/login'}>{authed ? t('nav.admin') : t('nav.login')}</Link>
              </li>
            </ul>
          </div>
          <div className="right">
            <a className="cta" href="/#contact">{t('nav.free_case_review')}</a>
            <button
              className="lang-toggle"
              type="button"
              aria-label={`${t('nav.toggle_label')}: ${i18n.language === 'es' ? 'Español' : 'English'}`}
              onClick={() => i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es')}
            >
              {i18n.language === 'es' ? 'ES' : 'EN'}
            </button>
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
      </div>
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <div className="mobile-head">
          <a className="cta mobile-cta" href="/#contact" onClick={() => setMenuOpen(false)}>{t('nav.free_case_review')}</a>
        </div>
        <ul>
          <li className="has-sub">
            <button className={`acc-head${mAboutOpen ? ' open' : ''}`} aria-expanded={mAboutOpen} onClick={() => setMAboutOpen(v => !v)}>
              <span>{t('nav.about')}</span>
              <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
            <ul className={`sub${mAboutOpen ? ' open' : ''}`}>
              {ABOUT_LINKS.map((it) => (
                <li key={it.to}>
                  {it.active ? (
                    <Link to={it.to} onClick={() => setMenuOpen(false)}>{it.label}</Link>
                  ) : (
                    <span className="nav-link-disabled">{it.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
          <li className="has-sub">
            <button className={`acc-head${mCasesOpen ? ' open' : ''}`} aria-expanded={mCasesOpen} onClick={() => setMCasesOpen(v => !v)}>
              <span>{t('nav.cases')}</span>
              <svg className="caret" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>
            </button>
            <ul className={`sub${mCasesOpen ? ' open' : ''}`}>
              {PRACTICE_AREAS.map((pa) => {
                const KEY_ALIASES: Record<string, string> = { car: 'car-accidents' }
                const internalKey = (KEY_ALIASES[pa.key] ?? pa.key) as keyof typeof PRACTICE_AREAS_MAP
                const isInternal = !!PRACTICE_AREAS_MAP[internalKey]
                const href = isInternal ? `/practice/${internalKey}` : pa.url
                return (
                  <li key={pa.key}>
                    {isInternal ? (
                      <Link to={href} onClick={() => setMenuOpen(false)}>{pa.label}</Link>
                    ) : (
                      <a href={href} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>{pa.label}</a>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
          <li><Link to="/articles#hero" onClick={() => setMenuOpen(false)}>{t('nav.blog')}</Link></li>
          <li><Link to="/contact" onClick={() => setMenuOpen(false)}>{t('nav.contact')}</Link></li>
          <li>
            <Link to={authed ? '/admin' : '/login'} onClick={() => setMenuOpen(false)}>
              {authed ? t('nav.admin') : t('nav.login')}
            </Link>
          </li>
          <li>
            <button
              className="lang-toggle"
              type="button"
              onClick={() => { i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es'); setMenuOpen(false) }}
            >
              {i18n.language === 'es' ? 'ES' : 'EN'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  )
}
