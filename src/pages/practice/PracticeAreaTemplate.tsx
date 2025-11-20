import '@/sections/HeroSection.css'
import './PracticeAreaTemplate.css'
import AboutSection from '@/sections/AboutSection'
import '@/sections/AboutSection.css'
import ContactSection from '@/sections/ContactSection'
import '@/sections/ContactSection.css'
import FAQSection from '@/sections/FAQSection'
import '@/sections/FAQSection.css'
import { useTranslation } from 'react-i18next'
import PracticeWelcomeVideo from '@/sections/PracticeWelcomeVideo'
import PracticeTwoCol from '@/sections/PracticeTwoCol'
import '@/sections/PracticeTwoCol.css'
import PracticeWhy from '@/sections/PracticeWhy'
import '@/sections/PracticeWhy.css'
import PracticeTestimonials from '@/sections/PracticeTestimonials'
import PracticeBento from '@/sections/PracticeBento'
import '@/sections/PracticeBento.css'

export type PracticeAreaData = {
  key: string
  name: string
  heroUrl?: string
  benefitsImageUrl?: string
  headline: string
  details: string
  ratingScore?: string
  ratingCount?: number
  videoId?: string
  testimonialsFolder?: string
  aboutStackTitle?: boolean
}

export default function PracticeAreaTemplate({ area }: { area: PracticeAreaData }) {
  const { t } = useTranslation()
  const score = area.ratingScore || '4.8'
  const count = area.ratingCount || 918
  const style = area.heroUrl ? { backgroundImage: `url('${area.heroUrl}')` } as React.CSSProperties : undefined
  const testimonialsFolder = (area.testimonialsFolder || (area.key || '').toLowerCase().replace(/-/g, '_'))
  const nameText = t(`practice_pages.${area.key}.name`, { defaultValue: area.name })
  const headlineText = t(`practice_pages.${area.key}.headline`, { defaultValue: area.headline })
  const detailsText = t(`practice_pages.${area.key}.details`, { defaultValue: area.details })
  const twoColDetailText = t(`practice_two_col_pages.${area.key}.detail`, { defaultValue: detailsText })
  const whyStrong = t(`practice_why_pages.${area.key}.strong`, { defaultValue: t('practice_why.strong') })
  const whyMuted = t(`practice_why_pages.${area.key}.muted`, { defaultValue: t('practice_why.muted') })
  const whyItems = [0,1,2,3].map(i => ({
    title: t(`practice_why_pages.${area.key}.items.${i}.title`, { defaultValue: t(`practice_why.items.${i}.title`) }),
    body: t(`practice_why_pages.${area.key}.items.${i}.body`, { defaultValue: t(`practice_why.items.${i}.body`) }),
  }))
  const makeMuted = (a: PracticeAreaData) => {
    const key = (a.key || '').toLowerCase()
    const name = (a.name || '').trim()
    const lower = name.toLowerCase()
    // Motor vehicle umbrella (car, motorcycle, truck, uber/lyft, pedestrian, bicycle, motor)
    if (/(motor|car|truck|trucking|motorcycle|uber|lyft|rideshare|pedestrian|bicycle|bike)/.test(key) || /(motor|car|truck|motorcycle|uber|lyft|pedestrian|bicycle|bike)/.test(lower)) {
      return t('practice_about.motor_vehicle')
    }
    // Generic patterns
    if (/accident/.test(lower)) return t('practice_about.accident_generic', { lower })
    if (/injur/.test(lower)) return t('practice_about.injury_generic', { lower })
    if (/malpractice/.test(lower)) return t('practice_about.malpractice_generic', { lower })
    if (/wrongful\s+death/.test(lower)) return t('practice_about.wrongful_death')
    // Fallback
    return t('practice_about.fallback', { lower })
  }
  const aboutMutedOverride = (t(`practice_about_pages.${area.key}.muted`, { defaultValue: '' }) || '').trim()
  const mutedLine = aboutMutedOverride || makeMuted(area)
  const aboutStackTitle = typeof area.aboutStackTitle === 'boolean' ? area.aboutStackTitle : true
  return (
    <>
      <section className="pa-hero" id="hero" style={style}>
        <div className="pa-block">
          <div className="pa-rating">
            <img src="/SVG/Google__G__logo.svg" alt="Google" className="google-g" width={18} height={18} />
            <span className="score">{score} {t('common.rating')}</span>
            <span className="sep">•</span>
            <span className="reviews">{t('common.reviews_from_count', { count })}</span>
          </div>
          <h1 className="pa-title">{headlineText}</h1>
          <p className="pa-detail">{detailsText}</p>
          <div className="pa-actions">
            <a className="btn primary" href="/#contact">{t('nav.free_case_review')}</a>
            <a className="btn call" href="tel:15612222222">
              <span className="icon-box" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l1.82-1.82a1 1 0 011.01-.24 11.72 11.72 0 003.68.59 1 1 0 011 1v2.5a1 1 0 01-1 1C10.07 20.42 3.58 13.93 2 5.7a1 1 0 011-1h2.5a1 1 0 011 1c.04 1.27.25 2.49.59 3.68a1 1 0 01-.24 1.01l-1.82 1.82z"/>
                </svg>
              </span>
              <span className="btn-lines">
                <span className="btn-topline">CHOOSE THE 2<span className="lower-s">s</span>!<span className="tm">™</span></span>
                <span className="btn-number">561-222-2222</span>
              </span>
            </a>
          </div>
        </div>
        <div className="pa-tag">{nameText}</div>
      </section>

      <PracticeWelcomeVideo
        videoId={area.videoId || 'hBeQHy67wTo'}
        placeholderSrc="/images/practice/welcome-video-placeholder.png"
      />

      <AboutSection
        eyebrow={t('practice_about_section.eyebrow')}
        strongFirst
        stackTitleLines={aboutStackTitle}
        strong={t('practice_about_section.strong')}
        muted={mutedLine}
        showImage={false}
        copy=""
      />

      <PracticeTwoCol
        imageUrl={area.benefitsImageUrl || area.heroUrl || '/images/practice/motor-accidents-hero.png'}
        detail={twoColDetailText}
        areaKey={area.key}
      />

      <PracticeWhy
        eyebrow={t('practice_why.eyebrow')}
        strong={whyStrong}
        muted={whyMuted}
        items={whyItems}
      />

      <PracticeTestimonials folder={testimonialsFolder} />

      <PracticeBento
        areaName={nameText}
        neighborhoods={[
          'Riviera Beach','Lake Worth','Boynton Beach','Wellington','Royal Palm Beach','Lantana','Jupiter','Greenacres','Atlantis'
        ]}
        ratingScore={score}
        ratingCount={count}
        quotes={[
          { text: 'What a wonderful experience. At GOLDLAW, you are treated like family! Thank you, Paul, and the entire team. Outstanding!!!!!', author: 'Karen R.', context: nameText },
          { text: 'Professional, responsive, and compassionate from start to finish.', author: 'Daniela M.', context: nameText },
        ]}
        actions={[
          t('practice_bento.actions.0'),
          t('practice_bento.actions.1'),
          t('practice_bento.actions.2'),
          t('practice_bento.actions.3'),
          t('practice_bento.actions.4'),
        ]}
        benefits={[
          { icon: 'clock', text: t('hero.bullet_available') },
          { icon: 'badge', text: t('hero.bullet_board_certified') },
          { icon: 'dollar', text: t('hero.bullet_no_fees') },
        ]}
      />

      <ContactSection />
      <FAQSection />
    </>
  )
}
