const cols = [
  { title: 'New', items: ['Truck MVA — Smith', 'Slip/Fall — Diaz'] },
  { title: 'Intake', items: ['Bike MVA — Patel'] },
  { title: 'Signed', items: ['Truck MVA — Gomez', 'Truck MVA — Chen'] },
  { title: 'Demand', items: ['MVA — Johnson'] },
  { title: 'Litigation', items: ['MVA — Rivera'] },
]

export default function CasesSection() {
  return (
    <div className="section">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {cols.map((c) => (
          <div key={c.title} className="card" style={{ minHeight: 280 }}>
            <h3>{c.title}</h3>
            <div style={{ display: 'grid', gap: 8 }}>
              {c.items.map((item) => (
                <div key={item} className="panel">{item}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
