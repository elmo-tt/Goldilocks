import './AboutSection.css'
import { useTranslation } from 'react-i18next'

export default function AboutSection({
  eyebrow,
  muted,
  strong,
  copy,
  showImage = true,
  strongFirst = false,
  stackTitleLines = false,
}: {
  eyebrow?: string
  muted?: string
  strong?: string
  copy?: string
  showImage?: boolean
  strongFirst?: boolean
  stackTitleLines?: boolean
}) {
  const { t } = useTranslation()
  const eyebrowText = eyebrow ?? t('about.eyebrow')
  const mutedText = muted ?? t('about.muted')
  const strongText = strong ?? t('about.strong')
  const copyText = copy ?? t('about.copy')
  const results = [
    { id: 'r1', amount: '$6.5M', desc: t('about.results.r1_desc') },
    { id: 'r2', amount: '$960K', desc: t('about.results.r2_desc') },
    { id: 'r3', amount: '$500,672', desc: t('about.results.r3_desc') },
    { id: 'r4', amount: '$2M', desc: t('about.results.r4_desc') },
  ]

  return (
    <section id="about" className="about">
      <div className="about-inner">
        <div className={`about-row1${showImage ? '' : ' no-image'}`}>
          <div className="about-text">
            <div className="eyebrow">{eyebrowText}</div>
            <h2 className={`about-title${stackTitleLines ? ' stack' : ''}`}>
              {strongFirst ? (
                <>
                  <span className="strong">{strongText}</span>{' '}
                  <span className="muted">{mutedText}</span>
                </>
              ) : (
                <>
                  <span className="muted">{mutedText}</span>{' '}
                  <span className="strong">{strongText}</span>
                </>
              )}
            </h2>
            {copyText && copyText.trim() && (
              <p className="about-copy">
                {copyText}
              </p>
            )}
          </div>
          {showImage && (
            <div className="about-image">
              <img src="/images/hero_attorneys.png" alt="GOLDLAW attorneys" />
              <div className="image-vignette" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="about-row2">
          <div className="results-grid">
            {results.map((r) => (
              <article key={r.id} className={"result-card"}>
                <div className="result-value">{r.amount}</div>
                <div className="result-desc">{r.desc}</div>
                <a className="result-cta" href="#">{t('about.learn_more')} <span className="arrow">→</span></a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
