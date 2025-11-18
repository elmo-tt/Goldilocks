import './HeroSection.css'
import { useTranslation } from 'react-i18next'

export default function HeroSection() {
  const { t } = useTranslation()
  return (
    <section className="hero" id="hero">
      <div className="hero-inner">
        <div className="hero-colA">
          <h1 className="hero-title">{t('hero.title')}<span className="tm">™</span></h1>
          <div className="hero-actions">
            <a className="btn primary" href="#contact">{t('nav.free_case_review')}</a>
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
          <div className="as-featured">
            <span className="label">{t('hero.as_featured_on')}</span>
            <span className="divider" aria-hidden="true"></span>
            <div className="logos">
              <img src="/SVG/CNN.svg" alt="CNN" />
              <img src="/SVG/TMZ_Logo.svg" alt="TMZ" />
              <img src="/SVG/ABC_News_logo_2021.svg" alt="ABC News" />
              <img src="/SVG/MSNBC_2015-2021_logo.svg" alt="MSNBC" className="msnbc" />
            </div>
          </div>
        </div>
        <div className="hero-colB">
          <div className="hero-card">
            <div className="metric-value">$1B+</div>
            <div className="metric-caption">{t('hero.metric_total_caption')}</div>
          </div>
          <div className="hero-card">
            <div className="metric-value">95%</div>
            <div className="metric-caption">{t('hero.metric_top_settlements_caption')}</div>
          </div>
          <div className="hero-card">
            <div className="metric-value">200+</div>
            <div className="metric-caption">{t('hero.metric_years_caption')}</div>
          </div>
          <div className="hero-card rating-card">
            <div className="rating-top">
              <img src="/SVG/wreath.svg" alt="" aria-hidden="true" className="wreath" />
              <div className="rating-overlay">
                <div className="stars">
                  <span className="rating-score">4.8</span>
                  <span className="rating-outof">/ 5.0</span>
                  <span className="rating-reviews">{t('hero.rating_from_reviews')}</span>
                  <img src="/SVG/Google__G__logo.svg" alt="Google" className="google-g" />
                </div>
              </div>
            </div>
            <div className="rating-bottom">
              <div className="rating-item">
                <svg className="check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"/></svg>
                <span>{t('hero.bullet_available')}</span>
              </div>
              <div className="rating-item">
                <svg className="check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"/></svg>
                <span>{t('hero.bullet_board_certified')}</span>
              </div>
              <div className="rating-item">
                <svg className="check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"/></svg>
                <span>{t('hero.bullet_no_fees')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
