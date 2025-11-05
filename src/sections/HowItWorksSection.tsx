import MagicBento from '@/components/MagicBento'
import './HowItWorksSection.css'

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="hiw">
      <div className="hiw-inner">
        <header className="hiw-head">
          <div className="eyebrow">How it works</div>
          <h2 className="hiw-title">
            <span className="muted">Getting started is simple — </span>
            <span className="strong">no upfront costs, only pay if we win.</span>
          </h2>
          <p className="hiw-copy">We make it easy to get help fast. Our team reviews your case, builds your claim, and fights for the maximum compensation you deserve.</p>
        </header>

        <MagicBento
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="208, 174, 99"
        />
      </div>
    </section>
  )
}
