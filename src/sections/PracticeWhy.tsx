import './PracticeWhy.css'

type WhyItem = { title: string; body: string }

export default function PracticeWhy({
  eyebrow = 'WHY',
  strong,
  muted = '',
  items,
}: {
  eyebrow?: string
  strong: string
  muted?: string
  items: WhyItem[]
}) {
  return (
    <section className="pa-why">
      <div className="pa-why-inner">
        <div className="why-head">
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="why-title">
            <span className="strong">{strong}</span>
            {muted ? <span className="muted"> {muted}</span> : null}
          </h2>
        </div>
        <ul className="why-list">
          {items.map((it, i) => (
            <li className="why-row" key={i}>
              <div className="why-left">
                <div className="why-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="why-htitle">{it.title}</div>
              </div>
              <div className="why-right">
                <p className="why-body">{it.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
