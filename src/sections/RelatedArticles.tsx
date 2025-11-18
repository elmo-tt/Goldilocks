// Use full page navigation for reliable top-of-page scroll
import { ArticlesStore } from '@/shared/articles/store'
import { PRACTICE_AREAS } from '@/admin/data/goldlaw'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect, useState } from 'react'
import { ensureSpanishForArticle } from '@/shared/translate/service'

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

function readTime(text?: string, t?: (key: string, opts?: any) => string) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length
  const mins = Math.max(1, Math.round(words / 225))
  return t ? t('articles_page.min_read', { count: mins }) : `${mins} min read`
}

export default function RelatedArticles({ currentSlug, limit = 3 }: { currentSlug?: string; limit?: number }) {
  const { t, i18n } = useTranslation()
  const [, setTick] = useState(0)
  const published = ArticlesStore.published()
  let items = published.filter(a => a.slug !== currentSlug).slice(0, limit)
  // Fallback: if only one article exists (the current), show latest published anyway
  if (!items.length) items = published.slice(0, limit)
  if (!items.length) return null

  useEffect(() => {
    const isEs = i18n.language?.startsWith('es')
    if (!isEs) return
    const subset = items
    subset.forEach(a => { if (!(a as any).body_es) ensureSpanishForArticle(a).catch(() => {}) })
  }, [i18n.language, items.map(i => i.id).join(',')])

  useEffect(() => {
    const on = () => setTick(v => v + 1)
    window.addEventListener('gl:articles-updated', on as any)
    return () => window.removeEventListener('gl:articles-updated', on as any)
  }, [])

  return (
    <section className="related">
      <div className="related-inner">
        <h2 className="related-title">{t('related.title')}</h2>
        <div className="related-grid">
        {items.map(a => (
          <article key={a.id} className="related-card">
            <div className="related-top">
              <div className="eyebrow">{PRACTICE_AREAS.find(p => p.key === (a as any).category)?.label || t('related.category_fallback')}</div>
              <h3 className="related-h3"><Link to={`/articles/${a.slug}`}>{(() => {
                const isEs = i18n.language?.startsWith('es')
                const src = ArticlesStore.getBySlug(a.slug) || a
                return (isEs ? ((src as any).title_es) : undefined) || a.title
              })()}</Link></h3>
            </div>
            <div className="related-bottom">
              <span className="meta-item">{formatDate(a.updatedAt || a.createdAt)}</span>
              <span className="meta-sep">•</span>
              <span className="meta-item">{(() => {
                const isEs = i18n.language?.startsWith('es')
                const src = ArticlesStore.getBySlug(a.slug) || a
                const body = isEs ? (((src as any).body_es) || a.body) : a.body
                return readTime(body, t)
              })()}</span>
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}
