import './ArticlesList.css'
import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import { useSearchParams, Link } from 'react-router-dom'
import { useEffect, useMemo, useState, useLayoutEffect } from 'react'
import { ArticlesStore, type Article } from '@/shared/articles/store'
import { AssetStore } from '@/shared/assets/store'
import { PRACTICE_AREAS } from '@/admin/data/goldlaw'
import { useTranslation } from 'react-i18next'
import { ensureSpanishForArticle } from '@/shared/translate/service'

function formatDate(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}
function filterLangBlocks(s: string, lang: 'en' | 'es') {
  try {
    if (!s) return ''
    let out = String(s)
    out = out.replace(/<!--\s*lang:(en|es)\s*-->([\s\S]*?)<!--\s*\/\s*lang\s*-->/gi, (_m, g1, g2) => (String(g1).toLowerCase() === lang ? g2 : ''))
    out = out.replace(/\[lang:(en|es)\]([\s\S]*?)\[\/lang\]/gi, (_m, g1, g2) => (String(g1).toLowerCase() === lang ? g2 : ''))
    return out
  } catch { return s }
}
function calcReadMins(text?: string) {
  if (!text) return 1
  const words = text.trim().split(/\s+/).length
  const mins = Math.max(1, Math.round(words / 225))
  return mins
}

function usePublished() {
  const [items, setItems] = useState<Article[]>(() => ArticlesStore.published())
  useEffect(() => {
    const on = () => setItems(ArticlesStore.published())
    window.addEventListener('gl:articles-updated', on as any)
    return () => window.removeEventListener('gl:articles-updated', on as any)
  }, [])
  return items
}

function useAssetUrl(src?: string) {
  const [url, setUrl] = useState<string | undefined>(undefined)
  useEffect(() => {
    let mounted = true
    let revokeId: string | null = null
    const run = async () => {
      if (!src) { setUrl(undefined); return }
      if (src.startsWith('asset:')) {
        const id = src.slice(6)
        revokeId = id
        const u = await AssetStore.getUrl(id)
        if (mounted) setUrl(u)
      } else {
        setUrl(src)
      }
    }
    run()
    return () => { mounted = false; if (revokeId) AssetStore.revokeUrl(revokeId) }
  }, [src])
  return url
}

function Eyebrow({ a }: { a: Article }) {
  const { t } = useTranslation()
  const label = useMemo(() => PRACTICE_AREAS.find(p => p.key === a.category)?.label || t('related.category_fallback'), [a.category, t])
  return <div className="eyebrow">{label}</div>
}

function Hero({ a }: { a: Article }) {
  const { t, i18n } = useTranslation()
  const heroSrc = useAssetUrl(a.heroDataUrl || a.heroUrl)
  const isEs = i18n.language?.startsWith('es')
  const slug = a.slug
  const tTitleEs = isEs ? t(`articles_content.${slug}.title`, { defaultValue: '' }) : ''
  const tExcerptEs = isEs ? t(`articles_content.${slug}.excerpt`, { defaultValue: '' }) : ''
  const tBodyEs = isEs ? t(`articles_content.${slug}.body`, { defaultValue: '' }) : ''
  const markTitleEs = isEs ? ((a.body || '').match(/<!--\s*title:es\s*-->([\s\S]*?)<!--\s*\/\s*title\s*-->/i)?.[1]?.trim() || (a.body || '').match(/\[title:es\]([\s\S]*?)\[\/title\]/i)?.[1]?.trim() || '') : ''
  const markExcerptEs = isEs ? ((a.body || '').match(/<!--\s*excerpt:es\s*-->([\s\S]*?)<!--\s*\/\s*excerpt\s*-->/i)?.[1]?.trim() || (a.body || '').match(/\[excerpt:es\]([\s\S]*?)\[\/excerpt\]/i)?.[1]?.trim() || '') : ''
  const displayTitle = (isEs ? ((a as any).title_es || tTitleEs || markTitleEs) : undefined) || a.title
  const displayExcerpt = (isEs ? ((a as any).excerpt_es || tExcerptEs || markExcerptEs) : undefined) || a.excerpt
  const bodyRaw = (isEs ? ((a as any).body_es || tBodyEs) : undefined) || a.body
  const displayBody = isEs ? filterLangBlocks(bodyRaw || '', 'es') : filterLangBlocks(bodyRaw || '', 'en')
  return (
    <section className="blog blog-hero">
      <div className="blog-inner">
        <h1 className="blog-title">{t('articles_page.title')}</h1>
        <div className="blog-hero-grid">
          <div className="blog-hero-media">
            {heroSrc ? (
              <img src={heroSrc} alt={t('articles_page.featured_alt')} className="blog-hero-img" />
            ) : (
              <div className="blog-hero-fallback" />
            )}
          </div>
          <div className="blog-hero-content">
            <Eyebrow a={a} />
            <h2 className="blog-hero-h2">
              <Link to={`/articles/${a.slug}`}>{displayTitle}</Link>
            </h2>
            {displayExcerpt && <p className="blog-hero-excerpt">{displayExcerpt}</p>}
            <div className="meta-row" style={{ marginTop: 6 }}>
              <span>{formatDate(a.updatedAt || a.createdAt)}</span>
              <span>•</span>
              <span>{t('articles_page.min_read', { count: calcReadMins(displayBody) })}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function ArticlesList() {
  const { t, i18n } = useTranslation()
  useLayoutEffect(() => {
    let cancelled = false
    const hadHash = typeof window !== 'undefined' ? window.location.hash : ''
    let stripped = false
    const stripHash = () => {
      if (!hadHash || stripped) return
      try { window.history.replaceState({}, '', window.location.pathname + window.location.search); stripped = true } catch {}
    }
    const top = () => {
      if (cancelled) return
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        ;(document.scrollingElement || document.documentElement).scrollTop = 0
        document.body.scrollTop = 0
      } catch {}
    }
    const tryHash = () => {
      const h = window.location.hash
      if (!h) return false
      const el = document.querySelector(h) as HTMLElement | null
      if (el && typeof (el as any).scrollIntoView === 'function') { el.scrollIntoView({ block: 'start' }); stripHash(); return true }
      return false
    }
    // If hash anchor is present and found, handle immediately and stop here
    if (tryHash()) {
      return () => { cancelled = true }
    }
    let tries = 0
    const tick = () => {
      if (cancelled) return
      if (tryHash()) return
      if (tries++ < 12) requestAnimationFrame(tick)
      else {
        let kicks = 0
        const kick = () => { if (cancelled) return; top(); if (kicks++ < 6) requestAnimationFrame(kick) }
        stripHash()
        requestAnimationFrame(kick)
        setTimeout(() => { if (!cancelled) top() }, 150)
      }
    }
    requestAnimationFrame(tick)
    return () => { cancelled = true }
  }, [])
  const items = usePublished()
  const [sp, setSp] = useSearchParams()
  const pageSize = 9
  const categorySel = (sp.get('category') || sp.get('tag') || '').trim()
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)

  const featured = useMemo(() => {
    const exp = items.find(a => a.featured && a.status === 'published')
    if (exp) return exp
    const sorted = [...items].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return sorted[0]
  }, [items])

  const presentCats = useMemo(() => {
    const s = new Set<string>()
    for (const a of items) { const k = a.category?.trim(); if (k) s.add(k) }
    return s
  }, [items])
  const chips = useMemo(() => PRACTICE_AREAS.filter(p => presentCats.has(p.key)), [presentCats])

  const filtered = useMemo(() => {
    const base = items.filter(a => !featured || a.id !== featured.id)
    if (!categorySel) return base
    return base.filter(a => (a.category || '') === categorySel)
  }, [items, featured, categorySel])

  const shown = filtered.slice(0, page * pageSize)
  const hasMore = filtered.length > shown.length

  const setCategory = (key: string) => {
    const next = new URLSearchParams(sp)
    if (key) { next.set('category', key); next.delete('tag') } else { next.delete('category'); next.delete('tag') }
    next.set('page', '1')
    setSp(next, { replace: false })
  }
  const loadMore = () => {
    const next = new URLSearchParams(sp)
    next.set('page', String(page + 1))
    setSp(next, { replace: false })
  }

  // Auto-translate on-demand for featured + shown when viewing ES and no ES sources exist
  useEffect(() => {
    const isEs = i18n.language?.startsWith('es')
    if (!isEs) return
    const list: Article[] = []
    if (featured) list.push(featured)
    for (const a of shown) list.push(a)
    const seen = new Set<string>()
    const unique = list.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true })
    unique.forEach(a => {
      const slug = a.slug
      const tTitleEs = t(`articles_content.${slug}.title`, { defaultValue: '' })
      const tBodyEs = t(`articles_content.${slug}.body`, { defaultValue: '' })
      const hasFields = !!(a as any).body_es
      const hasI18n = !!(tTitleEs || tBodyEs)
      const hasMarkers = /<!--\s*lang:es\s*-->|\[lang:es\]/i.test(a.body || '') || /<!--\s*title:es\s*-->|\[title:es\]/i.test(a.body || '')
      if (!hasFields && !hasI18n && !hasMarkers) {
        ensureSpanishForArticle(a).catch(() => {})
      }
    })
  }, [i18n.language, featured?.id, shown.map(a => a.id).join(','), shown.length])

  return (
    <>
      <StickyNav />
      {/* Anchor to preserve StickyNav topbar behavior */}
      <div id="hero" style={{ height: 1, width: 1, overflow: 'hidden' }} />
      <main className="blog">
        {featured && <Hero a={featured} />}

        <section>
          <div className="blog-inner">
            <div className="blog-content">
              {/* Filters */}
              <div className="blog-filters">
                <button className={`blog-chip ${categorySel ? '' : 'active'}`} onClick={() => setCategory('')}>{t('articles_page.all')}</button>
                {chips.map(p => (
                  <button key={p.key} className={`blog-chip ${categorySel === p.key ? 'active' : ''}`} onClick={() => setCategory(p.key)}>{p.label}</button>
                ))}
              </div>

              {/* Grid */}
              {shown.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.7)' }}>{t('articles_page.empty')}</div>
              ) : (
                <div className="blog-grid">
                  {shown.map(a => (
                    <Card key={a.id} a={a} />
                  ))}
                </div>
              )}

              {/* Load more */}
              {hasMore && (
                <div className="blog-more">
                  <button className="btn blue" onClick={loadMore}>{t('articles_page.load_more')}</button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <FooterSection />
    </>
  )
}

function Card({ a }: { a: Article }) {
  const { t, i18n } = useTranslation()
  const isEs = i18n.language?.startsWith('es')
  const slug = a.slug
  const tTitleEs = isEs ? t(`articles_content.${slug}.title`, { defaultValue: '' }) : ''
  const tBodyEs = isEs ? t(`articles_content.${slug}.body`, { defaultValue: '' }) : ''
  const markTitleEs = isEs ? ((a.body || '').match(/<!--\s*title:es\s*-->([\s\S]*?)<!--\s*\/\s*title\s*-->/i)?.[1]?.trim() || (a.body || '').match(/\[title:es\]([\s\S]*?)\[\/title\]/i)?.[1]?.trim() || '') : ''
  const displayTitle = (isEs ? ((a as any).title_es || tTitleEs || markTitleEs) : undefined) || a.title
  const bodyRaw = (isEs ? ((a as any).body_es || tBodyEs) : undefined) || a.body
  const displayBody = isEs ? filterLangBlocks(bodyRaw || '', 'es') : filterLangBlocks(bodyRaw || '', 'en')
  return (
    <article className="blog-card">
      <div style={{ display: 'grid', gap: 8 }}>
        <Eyebrow a={a} />
        <h3 className="blog-card-title">
          <Link to={`/articles/${a.slug}`}>{displayTitle}</Link>
        </h3>
      </div>
      <div className="meta-row" style={{ marginTop: 'auto' }}>
        <span>{formatDate(a.updatedAt || a.createdAt)}</span>
        <span>•</span>
        <span>{t('articles_page.min_read', { count: calcReadMins(displayBody) })}</span>
      </div>
    </article>
  )
}
