import { useEffect, useMemo, useRef, useState } from 'react'
import type { NavId } from '../utils/intentParser'
import { parseCommand } from '../utils/intentParser'
import { CTA, OFFICES, PRACTICE_AREAS } from '../data/goldlaw'
import { simulatePushTaskToFilevine } from '../data/integrations'
import { bus } from '../utils/bus'
import { PanelLeft, Plus, X, Send, Bot, Trash2 } from 'lucide-react'

export type Message = { id: string; role: 'user' | 'assistant'; content: string; ts: number }
export type Conversation = { id: string; title: string; messages: Message[] }

function newId(prefix = 'id') { return prefix + '-' + Math.random().toString(36).slice(2, 9) }

function summarizeTitle(text: string) {
  const t = text.trim()
  if (!t) return 'New chat'
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

export default function CopilotOverlay({
  open,
  onClose,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  onNavigate: (nav: NavId, opts?: { minimize: boolean }) => void
}) {
  const STORAGE_KEY = 'gl_admin_copilot_convos'
  const [convos, setConvos] = useState<Conversation[]>([
    { id: newId('c'), title: 'Welcome', messages: [ { id: newId('m'), role: 'assistant', content: "Hi! I'm your GOLDLAW Copilot. Ask me to navigate (e.g., 'open marketing', '/cases') or summarize data (e.g., 'Summarize today\'s calls').", ts: Date.now() } ] }
  ])
  const [activeId, setActiveId] = useState(convos[0].id)
  const [input, setInput] = useState('')
  const [autoMinimize, setAutoMinimize] = useState(true)
  const messagesRef = useRef<HTMLDivElement | null>(null)

  const active = useMemo(() => convos.find(c => c.id === activeId)!, [convos, activeId])

  // Load conversations from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed: Conversation[] = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setConvos(parsed)
          setActiveId(parsed[0].id)
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist conversations whenever they change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(convos)) } catch {}
  }, [convos])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    try { el.scrollTop = el.scrollHeight } catch {}
  }, [active.messages.length, activeId, open])

  if (!open) return null

  const send = async () => {
    const text = input.trim()
    if (!text) return
    const userMsg: Message = { id: newId('m'), role: 'user', content: text, ts: Date.now() }
    const cmd = parseCommand(text, PRACTICE_AREAS)

    let reply = ''
    const doMinimize = () => { if (autoMinimize) onClose() }
    const openSafe = (url: string, target: string = '_blank') => {
      if (typeof window !== 'undefined') window.open(url, target)
    }

    switch (cmd.type) {
      case 'NAVIGATE': {
        reply = `Navigating to ${cmd.target}.`
        break
      }
      case 'CALL': {
        reply = `Calling GOLDLAW at ${CTA.phone}…`
        openSafe(CTA.tel, '_self')
        doMinimize()
        break
      }
      case 'CONTACT': {
        reply = 'Opening contact form…'
        openSafe(CTA.contactUrl, '_blank')
        doMinimize()
        break
      }
      case 'MAP': {
        const office = cmd.target === 'psl'
          ? OFFICES.find(o => o.city.toLowerCase().includes('lucie'))
          : OFFICES.find(o => o.city.toLowerCase().includes('west palm')) || OFFICES[0]
        reply = `Opening map to ${office?.city ?? 'office'}…`
        if (office) openSafe(office.mapsUrl, '_blank')
        doMinimize()
        break
      }
      case 'OPEN_PRACTICE': {
        reply = 'Opening practice page…'
        openSafe(cmd.url, '_blank')
        doMinimize()
        break
      }
      case 'CREATE_TASK': {
        const created = simulatePushTaskToFilevine(cmd.title)
        bus.emit('create-task', { title: created.title })
        reply = `Created task in Filevine: "${created.title}" (ID: ${created.id}).`
        doMinimize()
        break
      }
      default: {
        try {
          const res = await fetch('/.netlify/functions/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [...active.messages, userMsg] })
          })
          const data = await res.json().catch(() => ({} as any))
          reply = (data?.content || '').trim() || ''
          const calls = Array.isArray(data?.toolCalls) ? data.toolCalls as Array<{ name: string; args: any }> : []
          for (const c of calls) {
            if (!c || !c.name) continue
            if (c.name === 'createTask') {
              const title = String(c.args?.title || 'Follow up')
              const created = simulatePushTaskToFilevine(title)
              bus.emit('create-task', { title: created.title })
              onNavigate('tasks', { minimize: autoMinimize })
            } else if (c.name === 'navigate') {
              const target = (c.args?.target || 'overview') as NavId
              onNavigate(target, { minimize: autoMinimize })
            } else if (c.name === 'call') {
              openSafe(CTA.tel, '_self'); doMinimize()
            } else if (c.name === 'map') {
              const office: 'wpb' | 'psl' = (c.args?.office === 'psl') ? 'psl' : 'wpb'
              const off = office === 'psl'
                ? OFFICES.find(o => o.city.toLowerCase().includes('lucie'))
                : OFFICES.find(o => o.city.toLowerCase().includes('west palm')) || OFFICES[0]
              if (off?.mapsUrl) openSafe(off.mapsUrl, '_blank')
              doMinimize()
            }
          }
          if (!reply) reply = 'Done.'
        } catch {
          reply = 'Sorry, I could not get a response right now.'
        }
      }
    }

    const assistantMsg: Message = { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }
    setConvos(prev => prev.map(c => c.id === activeId ? { ...c, title: c.messages.length <= 1 ? summarizeTitle(text) : c.title, messages: [...c.messages, userMsg, assistantMsg] } : c))
    setInput('')

    if (cmd.type === 'NAVIGATE') {
      onNavigate(cmd.target, { minimize: autoMinimize })
    }
  }

  const newChat = () => {
    const c: Conversation = { id: newId('c'), title: 'New chat', messages: [ { id: newId('m'), role: 'assistant', content: 'What would you like to do?', ts: Date.now() } ] }
    setConvos(prev => [...prev, c])
    setActiveId(c.id)
  }

  const deleteChat = (id: string) => {
    setConvos(prev => {
      const next = prev.filter(c => c.id !== id)
      if (next.length === 0) {
        const c: Conversation = { id: newId('c'), title: 'New chat', messages: [ { id: newId('m'), role: 'assistant', content: 'What would you like to do?', ts: Date.now() } ] }
        setActiveId(c.id)
        return [c]
      }
      if (id === activeId) setActiveId(next[0].id)
      return next
    })
  }

  return (
    <div className="copilot-overlay">
      <aside className="copilot-sidebar">
        <div className="top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PanelLeft size={18} />
            <strong>Copilot</strong>
          </div>
          <button className="ops-btn" onClick={newChat} title="New chat"><Plus size={16} /> New</button>
        </div>
        <div className="copilot-list">
          {convos.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
              <button onClick={() => setActiveId(c.id)} style={{ background: c.id === activeId ? '#112044' : 'transparent', borderColor: c.id === activeId ? '#17306b' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={16} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{c.messages[c.messages.length - 1]?.content.slice(0, 42)}</div>
                  </div>
                </div>
              </button>
              <button className="ops-btn" onClick={() => deleteChat(c.id)} title="Delete chat" style={{ padding: 6, marginLeft: 6 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="copilot-main">
        <div className="bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={18} />
            <strong>GOLDLAW Copilot</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ops-muted)' }}>
              <input type="checkbox" checked={autoMinimize} onChange={e => setAutoMinimize(e.target.checked)} />
              Auto-minimize on navigate
            </label>
            <button className="ops-btn" onClick={onClose}><X size={16} /> Minimize</button>
          </div>
        </div>

        <div className="messages" ref={messagesRef}>
          {active.messages.map(m => (
            <div key={m.id} className={'msg ' + (m.role === 'user' ? 'me' : '')}>
              <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{m.role === 'user' ? 'You' : 'Copilot'}</div>
              <div>{m.content}</div>
            </div>
          ))}
        </div>

        <div className="input-bar">
          <input className="input" placeholder="Ask anything or use /overview /intake /cases /tasks /calendar /marketing /settings, /call, /contact, /map wpb|psl, /task 'Call client'" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
          <button className="ops-btn" onClick={send}><Send size={16} /> Send</button>
        </div>
      </main>
    </div>
  )
}
