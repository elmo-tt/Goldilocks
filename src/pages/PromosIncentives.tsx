import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import './PromosIncentivesPage.css'
import { useTranslation } from 'react-i18next'

export default function PromosIncentives() {
  const { t } = useTranslation()

  return (
    <>
      <StickyNav />
      {/* Anchor element for StickyNav topbar visibility logic */}
      <div id="hero" style={{ height: 1, width: 1, overflow: 'hidden' }} />

      <main className="promos-page">
        {/* Top hero: card + steps */}
        <section className="promos-hero">
          <div className="promos-hero-inner">
            <h1 className="promos-title">{t('promos_hero.page_title')}</h1>

            <div className="promos-grid">
              {/* Left: promo card */}
              <div className="promo-card-shell">
                <div className="promo-card">
                  <div className="promo-card-art" aria-hidden="true">
                    {/* Update this image path if needed */}
                    <img
                      src="/images/promos/thanksgiving-giveaway.jpg"
                      alt={t('promos_hero.image_alt')}
                      className="promo-image"
                    />
                  </div>
                  <p className="promo-terms">
                    <strong>{t('promos_hero.card_terms_prefix')}</strong>{' '}
                    {t('promos_hero.card_terms_body')}
                  </p>
                </div>
              </div>

              {/* Right: copy + numbered steps */}
              <div className="promo-copy">
                <h2 className="promo-headline">{t('promos_hero.headline')}</h2>
                <p className="promo-subcopy">
                  {t('promos_hero.details_heading')}
                  <br />
                  {t('promos_hero.runs_line')}
                  <br />
                  {t('promos_hero.winners_line')}
                  <br />
                  {t('promos_hero.location_line')}
                  <br />
                  <br />
                  {t('promos_hero.terms_heading')}
                  <br />
                  {t('promos_hero.terms_body')}
                  <br />
                  <br />
                  {t('promos_hero.closing_line')}
                </p>
                <a
                  href="https://www.instagram.com/p/DQmtFsLiVK4/?img_index=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="promos-submit"
                >
                  {t('promos_hero.go_to_post')}
                </a>
                <ol className="promo-steps">
                  <li>
                    <span className="step-number">01</span>
                    <span className="step-text">{t('promos_hero.steps.s1')}</span>
                  </li>
                  <li>
                    <span className="step-number">02</span>
                    <span className="step-text">{t('promos_hero.steps.s2')}</span>
                  </li>
                  <li>
                    <span className="step-number">03</span>
                    <span className="step-text">{t('promos_hero.steps.s3')}</span>
                  </li>
                  <li>
                    <span className="step-number">04</span>
                    <span className="step-text">{t('promos_hero.steps.s4')}</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom body: blurb + email form and prizes list */}
        <section className="promos-body">
          <div className="promos-body-inner">
            <div className="promos-col promos-col-left">
              <h2 className="promos-section-title">{t('promos_page.title')}</h2>
              <p className="promos-body-copy">{t('promos_page.body')}</p>
              <form className="promos-form" onSubmit={(e) => e.preventDefault()}>
                <label className="promos-label" htmlFor="promos-email">
                  {t('promos_page.email_label')}
                </label>
                <input
                  id="promos-email"
                  type="email"
                  required
                  className="promos-input"
                  placeholder={t('promos_page.email_placeholder')}
                />
                <button type="submit" className="promos-submit">
                  {t('promos_page.cta')}
                </button>
              </form>
            </div>

            <div className="promos-col promos-col-right">
              <p className="promos-body-copy strong">{t('promos_page.right_body')}</p>
              <ul className="promos-prizes">
                <li>{t('promos_page.prizes.gift_cards')}</li>
                <li>{t('promos_page.prizes.sports_tickets')}</li>
                <li>{t('promos_page.prizes.concert_tickets')}</li>
                <li>{t('promos_page.prizes.electronics')}</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </>
  )
}
