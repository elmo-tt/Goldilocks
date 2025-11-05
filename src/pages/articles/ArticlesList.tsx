import { Link } from 'react-router-dom'
import { ArticlesStore } from '@/shared/articles/store'

export default function ArticlesList() {
  const items = ArticlesStore.published()
  return (
    <main style={{ padding: '80px 24px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 16 }}>Articles</h1>
        {items.length === 0 && (
          <div style={{ color: '#64748b' }}>No articles yet. Publish from the admin panel.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {items.map(a => (
            <article key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
              {(a.heroDataUrl || a.heroUrl) && (
                <img src={a.heroDataUrl || a.heroUrl} alt="hero" style={{ width: '100%', height: 160, objectFit: 'cover' }} />
              )}
              <div style={{ padding: 12 }}>
                <h3 style={{ margin: '0 0 8px' }}>
                  <Link to={`/articles/${a.slug}`}>{a.title}</Link>
                </h3>
                {a.excerpt && <p style={{ margin: 0, color: '#475569' }}>{a.excerpt}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
