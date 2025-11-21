import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import ContactForm from '@/sections/ContactForm'
import './ContactPage.css'
import { CTA } from '@/admin/data/goldlaw'
import { useTranslation } from 'react-i18next'

export default function ContactPage() {
  const { t } = useTranslation()
  return (
    <>
      <StickyNav />
      <div id="hero" style={{ height: 1, width: 1, overflow: 'hidden' }} />
      <main className="contact-page">
        <section className="contact-hero">
          <div className="contact-hero-inner">
            <div className="cp-left">
              <div className="cp-eyebrow">{t('contact_page.eyebrow')}</div>
              <h1 className="cp-title">
                <span>{t('contact_page.title_line1')}</span>
                <br />
                <span>{t('contact_page.title_line2')}</span>
              </h1>
              <p className="cp-body">{t('contact_page.body')}</p>
              <div className="cp-cta">
                <a className="ft-call" href={CTA.tel}>
                  <span className="ft-call-ico" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1v3.5a1 1 0 01-1 1C11.85 21.02 2.98 12.15 2.98 1.99a1 1 0 011-1H7.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.21z"/></svg>
                  </span>
                  <span className="ft-lines">
                    <span className="ft-topline">CHOOSE THE 2<span className="lower-s">s</span>!<span className="tm">™</span></span>
                    <span className="ft-number">{CTA.phone}</span>
                  </span>
                </a>
              </div>

              <div className="cp-bottom">
                <div className="cp-card">
                  <div className="cp-card-title">{t('contact_page.visit_us_title')}</div>
                  <div className="cp-card-body">
                    <p>{t('contact_page.visit_us_office1_line1')}<br />{t('contact_page.visit_us_office1_line2')}</p>
                    <p>{t('contact_page.visit_us_office2_line1')}<br />{t('contact_page.visit_us_office2_line2')}</p>
                    <p>{t('contact_page.visit_us_office3_line1')}<br />{t('contact_page.visit_us_office3_line2')}</p>
                  </div>
                </div>
                <div className="cp-card">
                  <div className="cp-card-title">{t('contact_page.follow_us_title')}</div>
                  <div className="cp-socials">
                    <a aria-label="TikTok" href="#" className="cp-soc">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 3c1 3 3 5 6 5v3c-2 0-4-1-6-2v7a6 6 0 11-6-6h1v3h-1a3 3 0 103 3V3h3z"/></svg>
                    </a>
                    <a aria-label="YouTube" href="#" className="cp-soc">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23 7a4 4 0 00-3-3C17.5 3.5 12 3.5 12 3.5s-5.5 0-8 0.5A4 4 0 001 7C0.5 9.5 0.5 12 0.5 12s0 2.5 0.5 5a4 4 0 003 3c2.5.5 8 .5 8 .5s5.5 0 8-.5a4 4 0 003-3c.5-2.5.5-5 .5-5s0-2.5-.5-5zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                    </a>
                    <a aria-label="Facebook" href="#" className="cp-soc">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 22v-8h3l1-4h-4V7a2 2 0 012-2h2V1h-3a5 5 0 00-5 5v4H6v4h3v8h4z"/></svg>
                    </a>
                    <a aria-label="LinkedIn" href="#" className="cp-soc">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 102.5 6a2.5 2.5 0 002.48-2.5zM3 8h4v13H3V8zm7 0h3.8v1.8h.1a4.2 4.2 0 013.8-2c4.1 0 4.9 2.7 4.9 6.2V21H18v-5.8c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H10V8z"/></svg>
                    </a>
                    <a aria-label="Instagram" href="#" className="cp-soc">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm6.5-.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z"/></svg>
                    </a>
                    <a aria-label="X" href="#" className="cp-soc">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 2h3l-7.5 9.1L22 22h-6l-4.6-6L6 22H3l8-9.7L2 2h6l4.1 5.6L18 2z"/></svg>
                    </a>
                    <a aria-label="Google" href="#" className="cp-soc">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.35 11.1H12v2.9h5.35A5.7 5.7 0 116 12a5.6 5.6 0 0110.2-3.6l2.1-2.1A9 9 0 103 12a9 9 0 0015.3 6.4 8.7 8.7 0 002.7-6.3c0-.7-.1-1.3-.35-1.9z"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="cp-right">
              <div className="cp-form-shell">
                <ContactForm />
                <div className="cp-checks">
                  <label className="cp-check">
                    <input type="checkbox" />
                    <span>{t('contact_page.checkbox_immediate_ok')}</span>
                  </label>
                  <label className="cp-check">
                    <input type="checkbox" />
                    <span>{t('contact_page.checkbox_sms_consent')}</span>
                  </label>
                </div>
                <button className="cp-submit" type="button">
                  <span>{t('contact_page.submit_label')}</span>
                  <span className="cp-submit-arrow" aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <FooterSection />
    </>
  )
}
