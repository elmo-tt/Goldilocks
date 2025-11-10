import './AboutSection.css'

export default function AboutSection({
  eyebrow = 'ABOUT US',
  muted = 'Delivering the results our',
  strong = 'clients deserve.',
  copy = 'At GOLDLAW, we don’t measure success by office size or flashy billboards— we measure it by the results we deliver. While other firms may settle quickly or play it safe, we fight hard for every client and never back down from getting you the justice you deserve.',
  showImage = true,
  strongFirst = false,
  stackTitleLines = false,
}: {
  eyebrow?: string
  muted?: string
  strong?: string
  copy?: string
  showImage?: boolean
  strongFirst?: boolean
  stackTitleLines?: boolean
}) {
  const results = [
    { id: 'r1', amount: '$6.5M', desc: 'Tow truck driver killed by Semi-Truck' },
    { id: 'r2', amount: '$960K', desc: 'Young Woman Falls in Big Box Store' },
    { id: 'r3', amount: '$500,672', desc: 'Ng, Sandi v. Walmart Verdict' },
    { id: 'r4', amount: '$2M', desc: 'Young child dies of undiagnosed illness' },
  ]

  return (
    <section id="about" className="about">
      <div className="about-inner">
        <div className={`about-row1${showImage ? '' : ' no-image'}`}>
          <div className="about-text">
            <div className="eyebrow">{eyebrow}</div>
            <h2 className={`about-title${stackTitleLines ? ' stack' : ''}`}>
              {strongFirst ? (
                <>
                  <span className="strong">{strong}</span>{' '}
                  <span className="muted">{muted}</span>
                </>
              ) : (
                <>
                  <span className="muted">{muted}</span>{' '}
                  <span className="strong">{strong}</span>
                </>
              )}
            </h2>
            {copy && copy.trim() && (
              <p className="about-copy">
                {copy}
              </p>
            )}
          </div>
          {showImage && (
            <div className="about-image">
              <img src="/images/hero_attorneys.png" alt="GOLDLAW attorneys" />
              <div className="image-vignette" aria-hidden="true" />
            </div>
          )}
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
