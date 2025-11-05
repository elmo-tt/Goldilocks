import { OUTLOOK_EVENTS, type OutlookEvent } from '../data/integrations'

function fmtRange(e: OutlookEvent) {
  try {
    const start = new Date(e.start)
    const end = new Date(e.end)
    const d = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    const t1 = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    const t2 = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${d} • ${t1}–${t2}`
  } catch {
    return e.start
  }
}

export default function CalendarSection() {
  return (
    <div className="section">
      <div className="card">
        <h3>Upcoming</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {OUTLOOK_EVENTS.map(e => (
            <div key={e.id} style={{ display: 'grid', gap: 4, border: '1px solid var(--ops-border)', borderRadius: 10, padding: '10px 12px', background: 'var(--ops-blue-2)' }}>
              <div style={{ fontWeight: 600 }}>{e.subject}</div>
              <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{fmtRange(e)}{e.location ? ` • ${e.location}` : ''}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
