import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import PracticeAreaTemplate from '@/pages/practice/PracticeAreaTemplate'
import { PRACTICE_AREAS_MAP } from '@/pages/practice/areas'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function PracticeAreaPage() {
  const { key } = useParams<{ key: string }>()
  const { t } = useTranslation()
  const area = key ? PRACTICE_AREAS_MAP[String(key)] : undefined

  return (
    <>
      <StickyNav />
      <div id="hero" style={{ position: 'absolute', top: 0, height: 1, width: 1, overflow: 'hidden' }} />
      {area ? (
        <PracticeAreaTemplate area={area} />
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
