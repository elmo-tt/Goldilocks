import { useEffect, useMemo, useState } from 'react'
import './AdminStyles.css'
import './AdminTheme.css'
import OverviewSection from './sections/OverviewSection'
import IntakeSection from './sections/IntakeSection'
import CasesSection from './sections/CasesSection'
import TasksSection from './sections/TasksSection'
import CalendarSection from './sections/CalendarSection'
import MarketingSection from './sections/MarketingSection'
import SettingsSection from './sections/SettingsSection'
import type { NavId } from './utils/intentParser'
import CopilotOverlay from './components/CopilotOverlay'
import './components/Copilot.css'
import { Moon, Sun, Menu, LogOut, Bot, Home } from 'lucide-react'
import ArticlesSection from './sections/ArticlesSection'
import MediaSection from './sections/MediaSection'
import { bus } from './utils/bus'
import { ArticlesStore } from '../shared/articles/store'
import { PRACTICE_AREAS } from './data/goldlaw'

const NAV: { id: NavId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'intake', label: 'Intake' },
  { id: 'cases', label: 'Cases' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'articles', label: 'Articles' },
  { id: 'media', label: 'Media' },
  { id: 'settings', label: 'Settings' },
]

export default function AdminApp() {
  const [nav, setNav] = useState<NavId>('overview')
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [fabHidden, setFabHidden] = useState(false)
  const THEME_KEY = 'gl_admin_theme'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const v = typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null
      return v === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])

  useEffect(() => {
    const KEY = 'gl_migr_2025_11_06_cta_excerpt_v3'
    try { if (localStorage.getItem(KEY) === 'done') return }
    catch {}
    const norm = (s: string) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    const findPALabel = (tags?: string[], ref?: string, context?: string) => {
      try {
        const cands: string[] = []
        if (Array.isArray(tags)) for (const t of tags) if (t && t.trim()) cands.push(t)
        if (ref && ref.trim()) cands.push(ref)
        if (context && context.trim()) cands.push(context.slice(0, 800))
        const cn = cands.map(norm)
        const aliases: Array<{ target: string; patterns: string[] }> = [
          { target: 'Trucking Accidents', patterns: ['truck accident', 'truck accidents', 'trucking accident', 'trucking accidents', 'semi truck', 'tractor trailer', '18 wheeler', 'big rig', 'commercial truck'] },
          { target: 'Negligent Security', patterns: ['negligent security', 'inadequate security', 'premises security'] },
        ]
        let bestLabel: string | undefined
        let bestScore = 0
        const score = (label: string, c: string) => {
          const ln = norm(label)
          if (!ln || !c) return 0
          if (c === ln) return 95
          if (c.includes(ln)) return 90
          const toks = ln.split(' ').filter(Boolean)
          let hits = 0
          for (const tk of toks) { if (c.includes(tk)) hits++ }
          const ratio = toks.length ? hits / toks.length : 0
          return Math.round(60 + 30 * ratio + Math.min(10, toks.length))
        }
        // score below against all PRACTICE_AREAS; no-op here
        for (const c of cn) {
          for (const a of aliases) {
            for (const p of a.patterns) {
              const pn = norm(p)
              if (pn && c.includes(pn)) { bestLabel = a.target; bestScore = 100 }
            }
          }
          for (const pa of PRACTICE_AREAS) {
            const sc = score(pa.label, c)
            if (sc > bestScore) { bestScore = sc; bestLabel = pa.label }
          }
        }
        return bestLabel
      } catch {}
      return undefined
    }
    const transformLabel = (label: string) => {
      const clean = String(label || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim()
      const n = clean.toLowerCase()
      if (n === 'premises liability') return 'Negligent Security'
      if (n === 'human trafficking liability') return 'Human Trafficking'
      return clean
    }
    const cleanHtml = (html: string, excerpt: string, tags: string[], title: string, keyphrase?: string) => {
      const c = document.createElement('div') as HTMLDivElement
      c.innerHTML = html || ''
      try {
        const p = c.querySelector('p') as HTMLParagraphElement | null
        const ex = (excerpt || '').trim().toLowerCase()
        const ft = (p?.textContent || '').trim().toLowerCase()
        if (ex && ft && ex === ft) p?.remove()
      } catch {}
      const nodes = Array.from(c.querySelectorAll('p,h1,h2,h3,h4,h5,h6')) as HTMLElement[]
      for (const node of nodes) {
        const t = (node.textContent || '').trim()
        if (/^(Introduction|Conclusion|Excerpt|Sources|References)\s*:?\s*$/i.test(t)) { node.remove(); continue }
        if (/^Article\s*:\s*/i.test(t)) { node.remove(); continue }
        if (/\bin focus:\b/i.test(t)) { node.remove(); continue }
        if (/[–—-]\s*Article\s*:\s*/i.test(t)) { node.remove(); continue }
      }
      const matched = findPALabel(tags, keyphrase || title, c.textContent || '')
      const display = matched ? transformLabel(matched) : ''
      const cta = matched
        ? `If you or someone you know has been a victim of ${display}, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
        : `If you need legal guidance regarding this topic, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
      const txt = (c.textContent || '').trim().toLowerCase()
      if (!txt.endsWith(cta.toLowerCase())) {
        const p = document.createElement('p')
        p.textContent = cta
        c.appendChild(p)
      }
      return c.innerHTML
    }
    const cleanMd = (src: string, excerpt: string, tags: string[], title: string, keyphrase?: string) => {
      let s = String(src || '')
      try {
        const parts = s.trim().split(/\n\n+/)
        const a = (parts[0] || '').trim().toLowerCase()
        const b = (excerpt || '').trim().toLowerCase()
        if (a && b && a === b) { parts.shift(); s = parts.join('\n\n') }
      } catch {}
      s = s
        .replace(/^\s*(?:#{1,6}\s*)?(Introduction|Conclusion|Excerpt|Sources|References)\s*:?\s*$/gim, '')
        .replace(/^\s*(?:#{1,6}\s*)?Article\s*:\s*.*$/gim, '')
        .replace(/^\s*.*\bin focus:\b.*$/gim, '')
        .replace(/^\s*.*[–—-]\s*Article\s*:\s*.*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
      const matched = findPALabel(tags, keyphrase || title, s)
      const display = matched ? transformLabel(matched) : ''
      const cta = matched
        ? `If you or someone you know has been a victim of ${display}, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
        : `If you need legal guidance regarding this topic, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
      const trimmed = s.replace(/\s+$/, '')
      if (!trimmed.toLowerCase().endsWith(cta.toLowerCase())) s = trimmed + '\n\n' + cta
      else s = trimmed
      return s
    }
    try {
      const all = ArticlesStore.all()
      let changed = 0
      for (const a of all) {
        const before = a.body || ''
        let after = before
        if (/<\w+[^>]*>/i.test(before)) after = cleanHtml(before, a.excerpt || '', a.tags || [], a.title || '', a.keyphrase)
        else after = cleanMd(before, a.excerpt || '', a.tags || [], a.title || '', a.keyphrase)
        if (after && after !== before) { ArticlesStore.save({ id: a.id, title: a.title, body: after }); changed++ }
      }
      try { localStorage.setItem(KEY, 'done') } catch {}
      if (changed > 0) { try { bus.emit('toast', { message: `Migrated ${changed} article(s).`, type: 'success' }) } catch {} }
    } catch {}
  }, [])

  // Hide FAB when other overlays request it (e.g., article media picker)
  useEffect(() => {
    const off = bus.on('fab', ({ hidden }: { hidden: boolean }) => {
      setFabHidden(!!hidden)
    })
    return off
  }, [])

  // URL hash syncing (#overview, #cases, etc.)
  useEffect(() => {
    const fromHash = () => {
      const h = (window.location.hash || '').replace(/^#/, '') as NavId
      if (h && ['overview','intake','cases','tasks','calendar','marketing','articles','media','settings'].includes(h)) {
        setNav(h)
      }
    }
    fromHash()
    const onHash = () => fromHash()
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const hash = `#${nav}`
    if (window.location.hash !== hash) {
      window.location.hash = hash
    }
  }, [nav])

  const section = useMemo(() => {
    switch (nav) {
      case 'overview': return <OverviewSection />
      case 'intake': return <IntakeSection />
      case 'cases': return <CasesSection />
      case 'tasks': return <TasksSection />
      case 'calendar': return <CalendarSection />
      case 'marketing': return <MarketingSection />
      case 'articles': return <ArticlesSection />
      case 'media': return <MediaSection />
      case 'settings': return <SettingsSection />
    }
  }, [nav])
  return (
    <div className="ops" data-theme={theme === 'light' ? 'light' : undefined} data-nav-open={navOpen ? 'true' : undefined}>
      <div className="ops-shell">
        <aside className="ops-sidebar">
          <div className="ops-brand">GOLDLAW Ops Studio</div>
          <nav className="ops-nav">
            {NAV.map(n => (
              <a
                key={n.id}
                href="#"
                className={nav === n.id ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setNav(n.id); setNavOpen(false) }}
              >
                {n.label}
              </a>
            ))}
          </nav>
        </aside>
        {navOpen && <div className="ops-nav-overlay" onClick={() => setNavOpen(false)} />}
        <main className="ops-main">
          <div className="ops-header">
            <div className="ops-header-inner">
              <div>
                <strong style={{ color: 'var(--ops-gold)' }}>{NAV.find(n => n.id === nav)?.label}</strong>
                <span className="ops-sub">Presentation mock</span>
              </div>
              <div className="ops-actions">
                <button className="ops-icon-btn mobile-only" onClick={() => setNavOpen(true)} title="Menu"><Menu size={18} /></button>
                <a className="ops-icon-btn" href="/" title="Home"><Home size={18} /></a>
                <button className="ops-icon-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} title="Toggle theme">
                  {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button className="ops-icon-btn" onClick={() => {
                  const key = 'gl_auth'
                  try { localStorage.removeItem(key) } catch {}
                  window.location.href = '/'
                }} title="Logout"><LogOut size={18} /></button>
              </div>
            </div>
          </div>
          <section className="ops-section">
            {section}
          </section>
          <ToastHost />
          {!copilotOpen && !fabHidden && (
            <button className="ops-fab" onClick={() => setCopilotOpen(true)} title="Open Copilot"><Bot size={20} /></button>
          )}
          <CopilotOverlay
            open={copilotOpen}
            onClose={() => setCopilotOpen(false)}
            onNavigate={(next, opts) => {
              setNav(next)
              if (opts?.minimize) setCopilotOpen(false)
            }}
          />
        </main>
      </div>
    </div>
  )
}

function ToastHost() {
  const [items, setItems] = useState<Array<{ id: string; msg: string; type: 'info'|'success'|'error' }>>([])
  useEffect(() => {
    const off = bus.on('toast', ({ message, type }) => {
      const id = Math.random().toString(36).slice(2, 9)
      setItems(prev => [...prev, { id, msg: message, type: (type||'info') }])
      setTimeout(() => setItems(prev => prev.filter(x => x.id !== id)), 3500)
    })
    return () => { off() }
  }, [])
  if (items.length === 0) return null
  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, display: 'grid', gap: 8, zIndex: 9999 }}>
      {items.map(t => (
        <div key={t.id} style={{ padding: '10px 12px', borderRadius: 10, color: '#fff', background: t.type==='success' ? 'rgba(16,185,129,0.95)' : (t.type==='error' ? 'rgba(239,68,68,0.95)' : 'rgba(59,130,246,0.95)') }}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}
