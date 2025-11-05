// Use full page navigation for reliable top-of-page scroll
import { ArticlesStore } from '@/shared/articles/store'

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
              {a.tags?.length ? <div className="eyebrow">{a.tags[0]}</div> : <div className="eyebrow">Article</div>}
              <h3 className="related-h3"><a href={`/articles/${a.slug}`}>{a.title}</a></h3>
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
