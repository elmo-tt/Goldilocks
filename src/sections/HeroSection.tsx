import './HeroSection.css'

export default function HeroSection() {
  return (
    <section className="hero" id="hero">
      <div className="hero-inner">
        <div className="hero-colA">
          <h1 className="hero-title">We Hold Accountable Those Who Hurt Others<span className="tm">™</span></h1>
          <div className="hero-actions">
            <a className="btn primary" href="#contact">Get a free case review</a>
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
            <span className="label">As featured on</span>
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
            <div className="metric-caption">in total amounts recovered for our amazing clients</div>
          </div>
          <div className="hero-card">
            <div className="metric-value">95%</div>
            <div className="metric-caption">of clients got a top settlement in under 1 year*</div>
          </div>
          <div className="hero-card">
            <div className="metric-value">200+</div>
            <div className="metric-caption">years of combined experience serving our clients</div>
          </div>
          <div className="hero-card rating-card">
            <div className="rating-top">
              <img src="/SVG/wreath.svg" alt="" aria-hidden="true" className="wreath" />
              <div className="rating-overlay">
                <div className="stars">
                  <span className="rating-score">4.8</span>
                  <span className="rating-outof">/ 5.0</span>
                  <span className="rating-reviews">From 918 Reviews</span>
                  <img src="/SVG/Google__G__logo.svg" alt="Google" className="google-g" />
                </div>
              </div>
            </div>
            <div className="rating-bottom">
              <div className="rating-item">
                <svg className="check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"/></svg>
                <span>Available 24/7</span>
              </div>
              <div className="rating-item">
                <svg className="check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"/></svg>
                <span>Board-certified Attorneys</span>
              </div>
              <div className="rating-item">
                <svg className="check" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.2l-3.5-3.5a1 1 0 10-1.4 1.4l4.2 4.2a1 1 0 001.4 0l10-10a1 1 0 10-1.4-1.4L9 16.2z"/></svg>
                <span>No Fees Or Costs Unless We Win</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
