import '@/sections/HeroSection.css'
import './PracticeAreaTemplate.css'
import AboutSection from '@/sections/AboutSection'
import '@/sections/AboutSection.css'
import ContactSection from '@/sections/ContactSection'
import '@/sections/ContactSection.css'
import FAQSection from '@/sections/FAQSection'
import '@/sections/FAQSection.css'
import PracticeWelcomeVideo from '@/sections/PracticeWelcomeVideo'

export type PracticeAreaData = {
  key: string
  name: string
  heroUrl?: string
  headline: string
  details: string
  ratingScore?: string
  ratingCount?: number
}

export default function PracticeAreaTemplate({ area }: { area: PracticeAreaData }) {
  const score = area.ratingScore || '4.8'
  const count = area.ratingCount || 918
  const style = area.heroUrl ? { backgroundImage: `url('${area.heroUrl}')` } as React.CSSProperties : undefined
  const makeMuted = (a: PracticeAreaData) => {
    const key = (a.key || '').toLowerCase()
    const name = (a.name || '').trim()
    const lower = name.toLowerCase()
    // Motor vehicle umbrella (car, motorcycle, truck, uber/lyft, pedestrian, bicycle, motor)
    if (/(motor|car|truck|trucking|motorcycle|uber|lyft|rideshare|pedestrian|bicycle|bike)/.test(key) || /(motor|car|truck|motorcycle|uber|lyft|pedestrian|bicycle|bike)/.test(lower)) {
      return 'who have been in a motor vehicle accident.'
    }
    // Generic patterns
    if (/accident/.test(lower)) return `who have been in ${lower}.`
    if (/injur/.test(lower)) return `who have suffered ${lower}.`
    if (/malpractice/.test(lower)) return `who have suffered ${lower}.`
    if (/wrongful\s+death/.test(lower)) return 'who have suffered a wrongful death.'
    // Fallback
    return `who need help with ${lower}.`
  }
  const mutedLine = makeMuted(area)
  return (
    <>
      <section className="pa-hero" id="hero" style={style}>
        <div className="pa-block">
          <div className="pa-rating">
            <img src="/SVG/Google__G__logo.svg" alt="Google" className="google-g" />
            <span className="score">{score} Rating</span>
            <span className="sep">•</span>
            <span className="reviews">From {count} Reviews</span>
          </div>
          <h1 className="pa-title">{area.headline}</h1>
          <p className="pa-detail">{area.details}</p>
          <div className="pa-actions">
            <a className="btn primary" href="/#contact">Get a free case review</a>
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
        <div className="pa-tag">{area.name}</div>
      </section>

      <PracticeWelcomeVideo
        videoId="hBeQHy67wTo"
        placeholderSrc="/images/practice/welcome-video-placeholder.png"
      />

      <AboutSection
        eyebrow="OUR IMPACT"
        strongFirst
        stackTitleLines
        strong="Delivering results for our clients"
        muted={mutedLine}
        showImage={false}
        copy=""
      />

      <ContactSection />
      <FAQSection />
    </>
  )
}
