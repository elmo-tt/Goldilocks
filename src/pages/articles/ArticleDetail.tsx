import { Link, useParams } from 'react-router-dom'
import { ArticlesStore } from '@/shared/articles/store'
import ArticleTemplate from './ArticleTemplate'
import RelatedArticles from '@/sections/RelatedArticles'
import '@/sections/RelatedArticles.css'
import { useTranslation } from 'react-i18next'

export default function ArticleDetail() {
  const { t } = useTranslation()
  const { slug } = useParams<{ slug: string }>()
  const a = slug ? ArticlesStore.getBySlug(slug) : undefined

  if (!a || a.status !== 'published') {
    return (
      <main style={{ padding: '80px 24px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ color: '#475569' }}>{t('articles_page.not_found')}</p>
          <p><Link to="/articles">{t('articles_page.back_to_articles')}</Link></p>
        </div>
      </main>
    )
  }

  return (
    <>
      <ArticleTemplate article={a} />
      <RelatedArticles currentSlug={a.slug} />
    </>
  )
}
