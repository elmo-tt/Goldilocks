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
import { Moon, Sun, Menu } from 'lucide-react'
import ArticlesSection from './sections/ArticlesSection'
import MediaSection from './sections/MediaSection'
import { bus } from './utils/bus'

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
                <button className="ops-btn mobile-only" onClick={() => setNavOpen(true)} title="Open menu"><Menu size={16} /> Menu</button>
                <button className="ops-btn" onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} title="Toggle theme">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Dark' : 'Light'} Mode
                </button>
                <button className="ops-btn" onClick={() => setCopilotOpen(true)}>Open Copilot</button>
                <button className="ops-btn" onClick={() => {
                  const key = 'gl_auth'
                  try { localStorage.removeItem(key) } catch {}
                  window.location.href = '/'
                }}>Logout</button>
              </div>
            </div>
          </div>
          <section className="ops-section">
            {section}
          </section>
          <ToastHost />
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
