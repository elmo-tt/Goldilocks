import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import RelatedArticles from '@/sections/RelatedArticles'
import '@/sections/RelatedArticles.css'
import ArticleTemplate from './ArticleTemplate'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ArticlesStore } from '@/shared/articles/store'
import { useTranslation } from 'react-i18next'
import { getBackend } from '@/shared/config'
import { CloudArticlesStore } from '@/shared/articles/cloud'

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const { t } = useTranslation()
  const [a, setA] = useState(() => (slug ? ArticlesStore.getBySlug(slug) : undefined))

  // Scroll to top on article change
  useEffect(() => {
    window.scrollTo(0, 0)
    let cancelled = false
    const updateFromLocal = () => setA(slug ? ArticlesStore.getBySlug(slug) : undefined)
    updateFromLocal()
    const on = () => updateFromLocal()
    window.addEventListener('gl:articles-updated', on as any)
    if (getBackend() === 'supabase' && slug) {
      CloudArticlesStore.getBySlug(slug).then((res) => {
        if (!cancelled) setA(res as any)
      }).catch(() => {})
    }
    return () => { cancelled = true; window.removeEventListener('gl:articles-updated', on as any) }
  }, [slug])

  return (
    <>
      <StickyNav />
      {/* Anchor to preserve StickyNav topbar behavior */}
      <div id="hero" style={{ height: 1, width: 1, overflow: 'hidden' }} />
      {a && a.status === 'published' ? (
        <>
          <ArticleTemplate key={a.id || a.slug} article={a} />
          <RelatedArticles currentSlug={a.slug} />
        </>
      ) : (
        <main style={{ padding: '80px 24px 24px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <p style={{ color: '#475569' }}>{t('articles_page.not_found')}</p>
          </div>
        </main>
      )}
      <FooterSection />
    </>
  )
}
