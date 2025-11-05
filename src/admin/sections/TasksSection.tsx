import { useEffect, useMemo, useState } from 'react'
import type { FilevineTask } from '../data/integrations'
import { FILEVINE_TASKS } from '../data/integrations'
import { bus } from '../utils/bus'

export default function TasksSection() {
  const [tasks, setTasks] = useState<FilevineTask[]>(() => FILEVINE_TASKS)
  const open = useMemo(() => tasks.filter(t => t.status === 'open'), [tasks])
  const done = useMemo(() => tasks.filter(t => t.status === 'done'), [tasks])

  useEffect(() => {
    const off = bus.on('create-task', ({ title }) => {
      const id = 'fv-' + Math.floor(1000 + Math.random() * 9000)
      setTasks(prev => [{ id, title, assignee: 'Unassigned', status: 'open' }, ...prev])
    })
    return off
  }, [])

  const toggle = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'open' ? 'done' as const : 'open' as const } : t))
  }

  return (
    <div className="section">
      <div className="card">
        <h3>Open Tasks</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {open.length === 0 && <div style={{ color: 'var(--ops-muted)' }}>No open tasks.</div>}
          {open.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--ops-border)', borderRadius: 10, padding: '8px 10px', background: 'var(--ops-blue-2)' }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong>{t.title}</strong>
                <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Assignee: {t.assignee || '—'}</span>
              </div>
              <button className="button" onClick={() => toggle(t.id)}>Mark done</button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="card">
        <h3>Completed</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {done.length === 0 && <div style={{ color: 'var(--ops-muted)' }}>No completed tasks.</div>}
          {done.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--ops-border)', borderRadius: 10, padding: '8px 10px', background: 'var(--ops-blue-2)', opacity: 0.9 }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <strong>{t.title}</strong>
                <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Assignee: {t.assignee || '—'}</span>
              </div>
              <button className="button" onClick={() => toggle(t.id)}>Reopen</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
