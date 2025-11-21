import StickyNav from '@/components/StickyNav'
import '@/components/StickyNav.css'
import FooterSection from '@/sections/FooterSection'
import '@/sections/FooterSection.css'
import './PromosIncentivesPage.css'

export default function PromosIncentives() {
  return (
    <>
      <StickyNav />
      {/* Anchor element for StickyNav topbar visibility logic */}
      <div
        id="hero"
        style={{ position: 'absolute', top: 0, height: 1, width: 1, overflow: 'hidden' }}
      />

      <main className="promos-page">
        {/* Top hero: card + steps */}
        <section className="promos-hero">
          <div className="promos-hero-inner">
            <h1 className="promos-title">Promos &amp; Incentives</h1>

            <div className="promos-grid">
              {/* Left: promo card */}
              <div className="promo-card-shell">
                <div className="promo-card">
                  <div className="promo-card-art" aria-hidden="true">
                    {/* Update this image path if needed */}
                    <img
                      src="/images/promos/thanksgiving-giveaway.jpg"
                      alt="Thanksgiving giveaway promo"
                      className="promo-image"
                    />
                  </div>
                  <p className="promo-terms">
                    <strong>* Terms &amp; Conditions:</strong>{' '}
                    Entrants must reside in Palm Beach County, Martin County, St. Lucie County or
                    Broward County to be eligible to enter to win. One entry per person. GOLDLAW
                    employees and immediate family may not participate.
                  </p>
                </div>
              </div>

              {/* Right: copy + numbered steps */}
              <div className="promo-copy">
                <h2 className="promo-headline">Enter to win a $100 Gift Card and FREE Turkey</h2>
                <p className="promo-subcopy">
                  GIVEAWAY DETAILS:
                  <br />
                  📅 Runs: Monday, November 3 – Friday, November 21 at 12:00 PM
                  <br />
                  🏆 Winners Announced: Friday, November 21
                  <br />
                  📍 Pickup Location: GOLDLAW Office – West Palm Beach
                  <br />
                  <br />
                  TERMS &amp; CONDITIONS:
                  <br />
                  Must live in Palm Beach, Martin, St. Lucie, or Broward County and be able to
                  receive prizes in person at our West Palm Beach Office.
                  <br />
                  <br />
                  Don&apos;t miss out—enter NOW for a chance to make this Thanksgiving one to remember!
                  🦃💛🍂
                </p>
                <a
                  href="https://www.instagram.com/p/DQmtFsLiVK4/?img_index=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="promos-submit"
                >
                  Go to Post →
                </a>
                <ol className="promo-steps">
                  <li>
                    <span className="step-number">01</span>
                    <span className="step-text">
                      Follow @800goldlaw
                    </span>
                  </li>
                  <li>
                    <span className="step-number">02</span>
                    <span className="step-text">
                      Like this post
                    </span>
                  </li>
                  <li>
                    <span className="step-number">03</span>
                    <span className="step-text">
                      Tag a friend you&apos;re thankful for in the comments
                    </span>
                  </li>
                  <li>
                    <span className="step-number">04</span>
                    <span className="step-text">
                      Share this post to your story &amp; tag @800goldlaw for an extra entry
                    </span>
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
              <h2 className="promos-section-title">
                Discover the Exciting Promotions &amp; Incentives at GOLDLAW
              </h2>
              <p className="promos-body-copy">
                To recognize and reward the support and dedication of our clients, past clients,
                future clients, and supporters, GOLDLAW is constantly running promotions and
                incentive programs, and it is time that you are well aware of them.
              </p>
              <form className="promos-form" onSubmit={(e) => e.preventDefault()}>
                <label className="promos-label" htmlFor="promos-email">
                  Enter your email
                </label>
                <input
                  id="promos-email"
                  type="email"
                  required
                  className="promos-input"
                  placeholder="Enter your email"
                />
                <button type="submit" className="promos-submit">
                  Get notified of promos →
                </button>
              </form>
            </div>

            <div className="promos-col promos-col-right">
              <p className="promos-body-copy strong">
                The GOLDLAW Marketing team will be holding at least one promotion each month, where
                lucky "winners" can take home cool prizes like:
              </p>
              <ul className="promos-prizes">
                <li>Gift Cards</li>
                <li>Tickets to Sports Events</li>
                <li>Tickets to Concerts, Shows, and Cultural Events</li>
                <li>Electronic devices and other cool swag!</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <FooterSection />
    </>
  )
}
