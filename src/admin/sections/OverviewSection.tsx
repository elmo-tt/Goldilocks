import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const kpi = [
  { label: 'Leads (30d)', value: 318 },
  { label: 'Signed (30d)', value: 46 },
  { label: 'Conv %', value: '14.5%' },
  { label: 'Revenue (QTD)', value: '$1.24M' },
  { label: 'Pipeline', value: '$4.8M' },
  { label: 'Avg CPL', value: '$92' },
]

const trend = Array.from({ length: 16 }, (_, i) => ({ day: `W${i + 1}`, leads: 160 + Math.round(Math.sin(i / 2) * 40) }))

export default function OverviewSection() {
  return (
    <div className="section">
      <div className="card-grid">
        {kpi.map((item, i) => (
          <div key={i} className="card" style={{ gridColumn: 'span 2' }}>
            <h3>{item.label}</h3>
            <div className="value">{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ height: 16 }} />

      <div className="card" style={{ height: 300 }}>
        <h3>Leads — Weekly trend</h3>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={trend} margin={{ top: 10, right: 8, bottom: 0, left: -18 }}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ab3ff" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4ab3ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--ops-border)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "var(--ops-muted)", fontSize: 12 }} axisLine={{ stroke: 'var(--ops-border)' }} tickLine={false} />
            <YAxis tick={{ fill: "var(--ops-muted)", fontSize: 12 }} axisLine={{ stroke: 'var(--ops-border)' }} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--ops-blue-2)', border: '1px solid var(--ops-border)', borderRadius: 8, color: 'var(--ops-text)' }} />
            <Area type="monotone" dataKey="leads" stroke="#4ab3ff" strokeWidth={2} fill="url(#g)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
