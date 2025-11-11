import { useState } from 'react'
import './PracticeBento.css'

export type PracticeBentoProps = {
  areaName: string
  neighborhoods: string[]
  ratingScore: string | number
  ratingCount: number
  quotes: { text: string; author: string; context?: string }[]
  actions: string[]
  benefits: { text: string; icon?: 'clock' | 'badge' | 'scale' | 'star' | 'shield' | 'dollar' }[]
}

export default function PracticeBento({
  areaName,
  neighborhoods,
  ratingScore,
  ratingCount,
  quotes,
  actions,
  benefits,
}: PracticeBentoProps) {
  const [active, setActive] = useState<number | null>(null)
  const Icon = ({ name }: { name?: PracticeBentoProps['benefits'][number]['icon'] }) => {
    if (name === 'clock') return (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 11h4v-2h-3V6h-2v7Z"/></svg>)
    if (name === 'badge') return (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2 3 7v6c0 5 9 9 9 9s9-4 9-9V7l-9-5Zm0 2.18 7 3.89V13c0 3.43-4.56 6.35-7 7.57C9.56 19.35 5 16.43 5 13V8.07l7-3.89Zm-1 3.82v5l4 2 .9-1.78-2.9-1.45V8H11Z"/></svg>)
    if (name === 'dollar') return (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M11 2h2v2.06c2.28.35 4 1.77 4 3.94 0 2.44-2.21 3.49-4.77 4.3-2.05.66-3.23 1.15-3.23 2.2 0 .86.79 1.5 2 1.7V22h2v-2.06c2.52-.36 4.2-1.9 4.2-4.06h-2c0 1.03-1.06 1.86-2.6 2.03-1.8.2-3.6-.53-3.6-2 0-1.38 1.35-2.07 3.4-2.73 2.25-.73 4.6-1.57 4.6-3.77 0-1.55-1.25-2.63-3-3V2Z"/></svg>)
    if (name === 'shield') return (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2 4 5v6c0 5.25 4.5 9.74 8 11 3.5-1.26 8-5.75 8-11V5l-8-3Zm0 2.2 6 2.25V11c0 3.94-3.1 7.58-6 8.98C9.1 18.58 6 14.94 6 11V6.45L12 4.2Z"/></svg>)
    if (name === 'star') return (<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>)
    return null
  }

  return (
    <section className="practice-bento">
      <div className="pb-inner">
        <div className="pb-grid">
          <article className="pb-card pb-areas">
            <h3 className="pb-title">Neighborhoods and Areas we serve for {areaName} Cases</h3>
            <div className="pb-chips">
              {neighborhoods.map((n, i) => (
                <span className="pb-chip" key={i}>{n}</span>
              ))}
            </div>
          </article>

          <article className="pb-card pb-reviews">
            <div className="pb-scorebox">
              <div className="rating-card">
                <div className="rating-top">
                  <img src="/SVG/wreath.svg" alt="" aria-hidden="true" className="wreath" />
                  <div className="rating-overlay">
                    <div className="stars">
                      <span className="rating-score">{String(ratingScore)}</span>
                      <span className="rating-outof">/ 5.0</span>
                      <span className="rating-reviews">From {ratingCount} Reviews</span>
                      <img src="/SVG/Google__G__logo.svg" alt="Google" className="google-g" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ul className="pb-quotes">
              {quotes.slice(0, 2).map((q, i) => (
                <li className="pb-quote" key={i}>
                  <blockquote className="pb-qtext">“{q.text}”</blockquote>
                  <div className="pb-qmeta">
                    <div className="pb-qauthor">{q.author}</div>
                    {q.context ? <div className="pb-qctx">{q.context}</div> : null}
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className={`pb-card pb-actions${active !== null ? ' has-active' : ''}`}>
            <h3 className="pb-title">What you should do before hiring us:</h3>
            <div className="pb-acc">
              {active !== null ? (
                <div className="pb-acc-inner">
                  <p>
                    {`${actions[active]} — Placeholder guidance: Document details, timelines, and any relevant materials. Keep notes organized and ready for your consultation.`}
                  </p>
                  <p>
                    {`We’ll review this together and advise next steps specific to your ${areaName.toLowerCase()} case.`}
                  </p>
                </div>
              ) : null}
            </div>
            <ul className="pb-list">
              {actions.map((a, i) => (
                <li
                  className={`pb-row${active === i ? ' active' : ''}`}
                  key={i}
                  onClick={() => setActive(active === i ? null : i)}
                >
                  <span className="pb-rowtext">{a}</span>
                  <span className="pb-plus" aria-hidden>{active === i ? '−' : '+'}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="pb-card pb-benefits">
            <ul className="pb-benefitlist">
              {benefits.map((b, i) => (
                <li className="pb-benefit" key={i}>
                  <span className="pb-ico"><Icon name={b.icon} /></span>
                  <span className="pb-btext">{b.text}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
