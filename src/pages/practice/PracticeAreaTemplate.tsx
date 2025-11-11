import '@/sections/HeroSection.css'
import './PracticeAreaTemplate.css'
import AboutSection from '@/sections/AboutSection'
import '@/sections/AboutSection.css'
import ContactSection from '@/sections/ContactSection'
import '@/sections/ContactSection.css'
import FAQSection from '@/sections/FAQSection'
import '@/sections/FAQSection.css'
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
}

export default function PracticeAreaTemplate({ area }: { area: PracticeAreaData }) {
  const score = area.ratingScore || '4.8'
  const count = area.ratingCount || 918
  const style = area.heroUrl ? { backgroundImage: `url('${area.heroUrl}')` } as React.CSSProperties : undefined
  const testimonialsFolder = (area.key || '').toLowerCase().replace(/-/g, '_')
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

      <PracticeTwoCol
        imageUrl={area.benefitsImageUrl || area.heroUrl || '/images/practice/motor-accidents-hero.png'}
        detail={area.details}
      />

      <PracticeWhy
        strong={"Auto accidents are among the leading causes of personal injury in Florida."}
        muted={"Here’s why you need an attorney."}
        items={[
          {
            title: 'You May Be Entitled to More Compensation Than You Realize',
            body:
              'After sustaining injuries in a car accident, many victims downplay their injuries or damages to avoid making a claim and potentially having their rates increase. However, you may be entitled to compensation for more than just physical injuries and property damage — including time off work, medical bills, and pain and suffering.',
          },
          {
            title: 'The Insurance Company Is Not On Your Side',
            body:
              'Insurers are businesses focused on profit. They may offer low settlements, delay, or deny claims outright. Having a legal advocate ensures the process moves forward and protects your rights.',
          },
          {
            title: 'You May Need to Take Your Claim to Court',
            body:
              'In some cases, taking your claim to court might be necessary to get the compensation you deserve. This could be because the insurance company has denied your claim or because they have made an unreasonably low settlement offer.',
          },
          {
            title: 'The Statute of Limitations Could Be Looming',
            body:
              'In Florida, the time limit for filing most car accident claims is now two years from the date of the accident. This may seem like a long time, but if you wait too long, important evidence, such as eyewitnesses and surveillance footage, can be more challenging to find. Consulting with a lawyer right away can make sure you\'re able to build a strong case that is filed on time.',
          },
        ]}
      />

      <PracticeTestimonials folder={testimonialsFolder} />

      <PracticeBento
        areaName={area.name}
        neighborhoods={[
          'Riviera Beach','Lake Worth','Boynton Beach','Wellington','Royal Palm Beach','Lantana','Jupiter','Greenacres','Atlantis'
        ]}
        ratingScore={score}
        ratingCount={count}
        quotes={[
          { text: 'What a wonderful experience. At GOLDLAW, you are treated like family! Thank you, Paul, and the entire team. Outstanding!!!!!', author: 'Karen R.', context: 'Auto Accident' },
          { text: 'Professional, responsive, and compassionate from start to finish.', author: 'Daniela M.', context: 'Auto Accident' },
        ]}
        actions={[
          'Gather evidence',
          'Seek medical attention',
          'Keep a detailed journal of symptoms and expenses',
          'Avoid giving recorded statements to insurers',
          'Do not post about the accident on social media',
        ]}
        benefits={[
          { icon: 'clock', text: 'Available 24/7' },
          { icon: 'badge', text: 'Board-certified attorneys' },
          { icon: 'dollar', text: 'No fees or costs unless we win' },
        ]}
      />

      <ContactSection />
      <FAQSection />
    </>
  )
}
