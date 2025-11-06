// Use full page navigation for reliable top-of-page scroll
import { ArticlesStore } from '@/shared/articles/store'
import { PRACTICE_AREAS } from '@/admin/data/goldlaw'
import { Link } from 'react-router-dom'

function formatDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

function readTime(text?: string) {
  if (!text) return '1 min read'
  const words = text.trim().split(/\s+/).length
  const mins = Math.max(1, Math.round(words / 225))
  return `${mins} min read`
}

export default function RelatedArticles({ currentSlug, limit = 3 }: { currentSlug?: string; limit?: number }) {
  const published = ArticlesStore.published()
  let items = published.filter(a => a.slug !== currentSlug).slice(0, limit)
  // Fallback: if only one article exists (the current), show latest published anyway
  if (!items.length) items = published.slice(0, limit)
  if (!items.length) return null

  return (
    <section className="related">
      <div className="related-inner">
        <h2 className="related-title">Other articles you may like</h2>
        <div className="related-grid">
        {items.map(a => (
          <article key={a.id} className="related-card">
            <div className="related-top">
              <div className="eyebrow">{PRACTICE_AREAS.find(p => p.key === (a as any).category)?.label || 'Article'}</div>
              <h3 className="related-h3"><Link to={`/articles/${a.slug}`}>{a.title}</Link></h3>
            </div>
            <div className="related-bottom">
              <span className="meta-item">{formatDate(a.updatedAt || a.createdAt)}</span>
              <span className="meta-sep">•</span>
              <span className="meta-item">{readTime(a.body)}</span>
            </div>
          </article>
        ))}
        </div>
      </div>
    </section>
  )
}
