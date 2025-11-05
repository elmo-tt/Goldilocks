import './AboutSection.css'

export default function AboutSection() {
  const results = [
    { id: 'r1', amount: '$6.5M', desc: 'Tow truck driver killed by Semi-Truck' },
    { id: 'r2', amount: '$960K', desc: 'Young Woman Falls in Big Box Store' },
    { id: 'r3', amount: '$500,672', desc: 'Ng, Sandi v. Walmart Verdict' },
    { id: 'r4', amount: '$2M', desc: 'Young child dies of undiagnosed illness' },
  ]

  return (
    <section id="about" className="about">
      <div className="about-inner">
        <div className="about-row1">
          <div className="about-text">
            <div className="eyebrow">ABOUT US</div>
            <h2 className="about-title">
              <span className="muted">Delivering the results our</span>{' '}
              <span className="strong">clients deserve.</span>
            </h2>
            <p className="about-copy">
              At GOLDLAW, we don’t measure success by office size or flashy billboards—
              we measure it by the results we deliver. While other firms may settle quickly or
              play it safe, we fight hard for every client and never back down from getting
              you the justice you deserve.
            </p>
          </div>
          <div className="about-image">
            <img src="/images/hero_attorneys.png" alt="GOLDLAW attorneys" />
            <div className="image-vignette" aria-hidden="true" />
          </div>
        </div>

        <div className="about-row2">
          <div className="results-grid">
            {results.map((r) => (
              <article key={r.id} className={"result-card"}>
                <div className="result-value">{r.amount}</div>
                <div className="result-desc">{r.desc}</div>
                <a className="result-cta" href="#">Learn more <span className="arrow">→</span></a>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
