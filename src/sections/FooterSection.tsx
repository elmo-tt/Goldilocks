import './FooterSection.css'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export default function FooterSection() {
  const { t } = useTranslation()
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="ft-col">
            <div className="ft-brand">
              <div className="ft-logo">GOLDLAW</div>
              <p className="ft-tag">{t('footer.tagline')}</p>
            </div>
          </div>
          <div className="ft-col">
            <div className="ft-contact">
              <div className="ft-title">{t('footer.contact')}</div>
              <div className="ft-addresses">
                <p>1641 Worthington Rd., Suite 300<br/>West Palm Beach, FL 33409</p>
                <p>1100 St Lucie W Blvd, Suite 103<br/>Port St. Lucie, FL 34986</p>
              </div>
            </div>
          </div>
          <div className="ft-col">
            <div className="ft-cta">
              <a className="ft-call" href="tel:15612222222">
                <span className="ft-call-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1v3.5a1 1 0 01-1 1C11.85 21.02 2.98 12.15 2.98 1.99a1 1 0 011-1H7.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.21z"/></svg>
                </span>
                <span className="ft-lines">
                  <span className="ft-topline">CHOOSE THE 2<span className="lower-s">s</span>!<span className="tm">™</span></span>
                  <span className="ft-number">561-222-2222</span>
                </span>
              </a>
              <div className="ft-socials">
                <a aria-label="TikTok" href="#" className="ft-soc">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 3c1 3 3 5 6 5v3c-2 0-4-1-6-2v7a6 6 0 11-6-6h1v3h-1a3 3 0 103 3V3h3z"/></svg>
                </a>
                <a aria-label="YouTube" href="#" className="ft-soc">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23 7a4 4 0 00-3-3C17.5 3.5 12 3.5 12 3.5s-5.5 0-8 0.5A4 4 0 001 7C0.5 9.5 0.5 12 0.5 12s0 2.5 0.5 5a4 4 0 003 3c2.5.5 8 .5 8 .5s5.5 0 8-.5a4 4 0 003-3c.5-2.5.5-5 .5-5s0-2.5-.5-5zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                </a>
                <a aria-label="Facebook" href="#" className="ft-soc">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M13 22v-8h3l1-4h-4V7a2 2 0 012-2h2V1h-3a5 5 0 00-5 5v4H6v4h3v8h4z"/></svg>
                </a>
                <a aria-label="LinkedIn" href="#" className="ft-soc">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 102.5 6a2.5 2.5 0 002.48-2.5zM3 8h4v13H3V8zm7 0h3.8v1.8h.1a4.2 4.2 0 013.8-2c4.1 0 4.9 2.7 4.9 6.2V21H18v-5.8c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1V21H10V8z"/></svg>
                </a>
                <a aria-label="Instagram" href="#" className="ft-soc">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm6.5-.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2z"/></svg>
                </a>
                <a aria-label="X" href="#" className="ft-soc">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18 2h3l-7.5 9.1L22 22h-6l-4.6-6L6 22H3l8-9.7L2 2h6l4.1 5.6L18 2z"/></svg>
                </a>
                <a aria-label="Google" href="#" className="ft-soc">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M21.35 11.1H12v2.9h5.35A5.7 5.7 0 116 12a5.6 5.6 0 0110.2-3.6l2.1-2.1A9 9 0 103 12a9 9 0 0015.3 6.4 8.7 8.7 0 002.7-6.3c0-.7-.1-1.3-.35-1.9z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-mid">
          <div className="fl-col">
            <div className="fl-title">{t('footer.practice_areas')}</div>
            <ul className="fl-list">
              <li><a href="#">{t('footer.practice_items.personal_injury')}</a></li>
              <li><a href="#">{t('footer.practice_items.car_accidents')}</a></li>
              <li><a href="#">{t('footer.practice_items.medical_malpractice')}</a></li>
              <li><a href="#">{t('footer.practice_items.slip_and_fall')}</a></li>
              <li><a href="#">{t('footer.practice_items.sexual_assault')}</a></li>
              <li><a href="#">{t('footer.practice_items.trucking_accidents')}</a></li>
              <li><a href="#">{t('footer.practice_items.wrongful_death')}</a></li>
              <li><a href="#">{t('footer.view_all')}</a></li>
            </ul>
          </div>
          <div className="fl-col">
            <div className="fl-title">{t('footer.company')}</div>
            <ul className="fl-list">
              <li><a href="#">{t('footer.about')}</a></li>
              <li><Link to="/team">{t('footer.team')}</Link></li>
              <li><a href="#">{t('footer.careers')}</a></li>
              <li><a href="#">{t('footer.community')}</a></li>
              <li><a href="#">{t('footer.press')}</a></li>
              <li><a href="#">{t('footer.contact_link')}</a></li>
            </ul>
          </div>
          <div className="fl-col">
            <div className="fl-title">{t('footer.resources')}</div>
            <ul className="fl-list">
              <li><a href="#">{t('footer.faq')}</a></li>
              <li><a href="#">{t('footer.blog')}</a></li>
              <li><a href="#">{t('footer.newsletters')}</a></li>
              <li><a href="#">{t('footer.promotions')}</a></li>
              <li><a href="#">{t('footer.testimonials')}</a></li>
            </ul>
          </div>
          <div className="fl-col">
            <div className="ft-news">
              <div className="ft-news-card">
                <div className="ft-news-title">{t('footer.subscribe_title')}</div>
                <p className="ft-news-sub">{t('footer.subscribe_sub')}</p>
                <form className="ft-form" onSubmit={(e)=>e.preventDefault()}>
                  <input type="email" className="ft-input" placeholder="Enter your email" required />
                  <button className="ft-btn" type="submit">{t('footer.sign_up')}</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
