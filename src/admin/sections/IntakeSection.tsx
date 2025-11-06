import type { CSSProperties } from 'react'

type CallItem = {
  id: string
  time: string
  name: string
  topic: string
  outcome: 'Connected' | 'Voicemail' | 'Missed' | 'Consult booked' | 'No show'
}

const today: CallItem[] = [
  { id: 'c1', time: '09:10 AM', name: 'John Smith', topic: 'Truck MVA', outcome: 'Consult booked' },
  { id: 'c2', time: '08:48 AM', name: 'Maria Gomez', topic: 'Slip & Fall', outcome: 'Connected' },
  { id: 'c3', time: '08:20 AM', name: 'Alex Rivera', topic: 'Negligent Security', outcome: 'Voicemail' },
  { id: 'c4', time: '07:55 AM', name: 'Kelly Brown', topic: 'Uber/Lyft', outcome: 'Missed' },
  { id: 'c5', time: '07:30 AM', name: 'D. Johnson', topic: 'TBI', outcome: 'Connected' },
]

function OutcomeBadge({ outcome }: { outcome: CallItem['outcome'] }) {
  const styles: Record<CallItem['outcome'], CSSProperties> = {
    'Consult booked': { background: 'rgba(34,197,94,0.18)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)' },
    'Connected': { background: 'rgba(59,130,246,0.18)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.35)' },
    'Voicemail': { background: 'rgba(234,179,8,0.18)', color: '#eab308', border: '1px solid rgba(234,179,8,0.35)' },
    'Missed': { background: 'rgba(239,68,68,0.18)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.35)' },
    'No show': { background: 'rgba(244,63,94,0.18)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.35)' },
  }
  return <span style={{ ...styles[outcome], padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>{outcome}</span>
}

export default function IntakeSection() {
  return (
    <div className="section">
      <div className="card">
        <h3>Today’s calls & consults</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {today.map(item => (
            <div key={item.id} className="ops-list-row">
              <div style={{ display: 'grid', gap: 2 }}>
                <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{item.time}</div>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{item.topic}</div>
              </div>
              <div className="ops-list-status"><OutcomeBadge outcome={item.outcome} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
