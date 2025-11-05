import { useEffect, useMemo, useRef, useState } from 'react'
import type { NavId } from '../utils/intentParser'
import { parseCommand } from '../utils/intentParser'
import { CTA, OFFICES, PRACTICE_AREAS } from '../data/goldlaw'
import { ArticlesStore } from '../../shared/articles/store'
import { getBackend } from '../../shared/config'
import { CloudArticlesStore } from '../../shared/articles/cloud'
import { simulatePushTaskToFilevine } from '../data/integrations'
import { bus } from '../utils/bus'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PanelLeft, Plus, X, Send, Bot, Trash2 } from 'lucide-react'

export type Message = { id: string; role: 'user' | 'assistant'; content: string; ts: number; typing?: boolean }
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
    setConvos(prev => prev.map(c => c.id === activeId ? { ...c, title: c.messages.length <= 1 ? summarizeTitle(text) : c.title, messages: [...c.messages, userMsg] } : c))
    setInput('')

    let reply = ''
    const doMinimize = () => { if (autoMinimize) onClose() }
    const openSafe = (url: string, target: string = '_blank') => {
      if (typeof window !== 'undefined') window.open(url, target)
    }

    switch (cmd.type) {
      case 'NAVIGATE': {
        reply = `Navigating to ${cmd.target}.`
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        onNavigate(cmd.target, { minimize: autoMinimize })
        break
      }
      case 'CALL': {
        reply = `Calling GOLDLAW at ${CTA.phone}…`
        openSafe(CTA.tel, '_self')
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        break
      }
      case 'CONTACT': {
        reply = 'Opening contact form…'
        openSafe(CTA.contactUrl, '_blank')
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        break
      }
      case 'MAP': {
        const office = cmd.target === 'psl'
          ? OFFICES.find(o => o.city.toLowerCase().includes('lucie'))
          : OFFICES.find(o => o.city.toLowerCase().includes('west palm')) || OFFICES[0]
        reply = `Opening map to ${office?.city ?? 'office'}…`
        if (office) openSafe(office.mapsUrl, '_blank')
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        break
      }
      case 'OPEN_PRACTICE': {
        reply = 'Opening practice page…'
        openSafe(cmd.url, '_blank')
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        break
      }
      case 'CREATE_TASK': {
        const created = simulatePushTaskToFilevine(cmd.title)
        bus.emit('create-task', { title: created.title })
        reply = `Created task in Filevine: "${created.title}" (ID: ${created.id}).`
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        break
      }
      default: {
        const thinkingId = newId('m')
        const thinking: Message = { id: thinkingId, role: 'assistant', content: '', typing: true, ts: Date.now() }
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, thinking] } : c))
        try {
          const res = await fetch('/.netlify/functions/copilot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [...active.messages, userMsg] })
          })
          const data = await res.json().catch(() => ({} as any))
          reply = (data?.content || '').trim() || ''
          const calls = Array.isArray(data?.toolCalls) ? data.toolCalls as Array<{ name: string; args: any }> : []
          let updateNote: string | undefined
          for (const c of calls) {
            if (!c || !c.name) continue
            if (c.name === 'createTask') {
              const title = String(c.args?.title || 'Follow up')
              const created = simulatePushTaskToFilevine(title)
              try {
                const KEY = 'gl_tasks'
                const raw = localStorage.getItem(KEY)
                const arr = raw ? JSON.parse(raw) : []
                const item = { id: created.id, title: created.title, assignee: 'Unassigned', status: 'open' as const }
                const next = Array.isArray(arr) ? [item, ...arr] : [item]
                localStorage.setItem(KEY, JSON.stringify(next))
              } catch {}
              onNavigate('tasks', { minimize: autoMinimize })
              setTimeout(() => { bus.emit('create-task', { title: created.title }) }, 0)
            } else if (c.name === 'createArticle') {
              try {
                const title = String(c.args?.title || 'Untitled')
                const excerpt = String(c.args?.excerpt || '')
                const body = String(c.args?.body || '')
                const tags = Array.isArray(c.args?.tags) ? c.args.tags.map((t: any) => String(t)).slice(0, 8) : []
                const keyphrase = c.args?.keyphrase ? String(c.args.keyphrase) : undefined
                const metaTitle = c.args?.metaTitle ? String(c.args.metaTitle) : undefined
                const metaDescription = c.args?.metaDescription ? String(c.args.metaDescription) : undefined
                const canonicalUrl = c.args?.canonicalUrl ? String(c.args.canonicalUrl) : undefined
                const noindex = typeof c.args?.noindex === 'boolean' ? Boolean(c.args.noindex) : undefined
                const status = (c.args?.status === 'published') ? 'published' : 'draft'
                ArticlesStore.save({ title, excerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl, noindex, status })
                onNavigate('articles', { minimize: autoMinimize })
                try { bus.emit('toast', { message: `Created article “${title}”.`, type: 'success' }) } catch {}
              } catch {}
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
            } else if (c.name === 'updateArticle') {
              try {
                const idArg = (c.args?.id ? String(c.args.id) : '').trim()
                const slugArg = (c.args?.slug ? String(c.args.slug) : '').trim()
                let art = idArg ? ArticlesStore.all().find(a => a.id === idArg) : undefined
                if (!art && slugArg) art = ArticlesStore.getBySlug(slugArg)
                // Supabase fallback: if not in local cache yet, fetch by slug
                if (!art && slugArg && getBackend() === 'supabase') {
                  try { art = await CloudArticlesStore.getBySlug(slugArg) } catch {}
                }
                // Fallback: try to match by a quoted title from the user's message
                if (!art) {
                  const raw = userMsg.content || ''
                  const all = ArticlesStore.all()
                  // Try quoted title first
                  const qm = raw.match(/["'“”‘’]([^"'“”‘’]{5,})["'“”‘’]/)
                  const qTitle = qm ? (qm[1] || '').trim() : ''
                  if (qTitle) {
                    art = all.find(a => a.title.toLowerCase() === qTitle.toLowerCase()) || all.find(a => a.title.toLowerCase().includes(qTitle.toLowerCase()))
                  }
                  // If still not found, see if any article title appears verbatim in the raw text
                  if (!art) {
                    const rawLower = raw.toLowerCase()
                    art = all.find(a => rawLower.includes(a.title.toLowerCase()))
                  }
                  // Keyword-based heuristic: match by topic words in title/tags/excerpt; prefer most recent on tie
                  if (!art) {
                    const rawLower = (userMsg.content || '').toLowerCase()
                    const tokens = (rawLower.match(/[a-z0-9]+/g) || [])
                    const stop = new Set(['the','and','for','with','that','this','from','about','into','onto','within','your','you','our','are','will','can','make','add','update','article','articles','post','posts','please','now'])
                    const keywords = Array.from(new Set(tokens.filter(w => w.length >= 4 && !stop.has(w)))).slice(0, 12)
                    let best: { a: any; score: number } | null = null
                    for (const a of all) {
                      const text = [a.title, (a.tags||[]).join(' '), a.excerpt || '', a.slug || ''].join(' ').toLowerCase()
                      let score = 0
                      for (const k of keywords) { if (text.includes(k)) score++ }
                      if (score > 0) {
                        if (!best) best = { a, score }
                        else if (score > best.score) best = { a, score }
                        else if (score === best.score && (a.updatedAt || 0) > (best.a.updatedAt || 0)) best = { a, score }
                      }
                    }
                    if (best) { art = best.a }
                  }
                }
                if (!art) {
                  updateNote = 'Could not locate the target article (need id/slug or an exact title).'
                  try { bus.emit('toast', { message: updateNote, type: 'error' }) } catch {}
                } else {
                  const providedTitle = c.args?.title ? String(c.args.title) : undefined
                  const fields: any = { id: art.id, slug: art.slug, title: providedTitle || art.title }
                  if (typeof c.args?.excerpt === 'string') fields.excerpt = String(c.args.excerpt)
                  if (typeof c.args?.body === 'string') fields.body = String(c.args.body)
                  if (Array.isArray(c.args?.tags)) fields.tags = c.args.tags.map((t: any) => String(t)).slice(0, 8)
                  if (typeof c.args?.keyphrase === 'string') fields.keyphrase = String(c.args.keyphrase)
                  if (typeof c.args?.metaTitle === 'string') fields.metaTitle = String(c.args.metaTitle)
                  if (typeof c.args?.metaDescription === 'string') fields.metaDescription = String(c.args.metaDescription)
                  if (typeof c.args?.canonicalUrl === 'string') fields.canonicalUrl = String(c.args.canonicalUrl)
                  if (typeof c.args?.noindex === 'boolean') fields.noindex = Boolean(c.args.noindex)
                  if (c.args?.status === 'published' || c.args?.status === 'draft') fields.status = c.args.status
                  ArticlesStore.save(fields)
                  onNavigate('articles', { minimize: autoMinimize })
                  updateNote = `Updated article “${fields.title}”.`
                  try { bus.emit('toast', { message: updateNote, type: 'success' }) } catch {}
                }
              } catch {}
            }
          }
          if (updateNote) {
            reply = reply ? `${reply}\n\n${updateNote}` : updateNote
          }
          // If the model returned no meaningful content and no tool calls, provide a clarifying prompt with suggestions.
          const isTrivial = (s: string) => /^(done|ok|okay|sure|noted)\.?$/i.test(s.trim())
          if ((!reply || isTrivial(reply)) && calls.length === 0) {
            try {
              const rawLower = (userMsg.content || '').toLowerCase()
              const tokens = (rawLower.match(/[a-z0-9]+/g) || [])
              const stop = new Set(['the','and','for','with','that','this','from','about','into','onto','within','your','you','our','are','will','can','make','add','update','article','articles','post','posts','please','now'])
              const keywords = Array.from(new Set(tokens.filter(w => w.length >= 4 && !stop.has(w)))).slice(0, 10)
              const all = ArticlesStore.all()
              const scored = all.map(a => {
                const text = [a.title, (a.tags||[]).join(' '), a.excerpt || '', a.slug || ''].join(' ').toLowerCase()
                let score = 0; for (const k of keywords) { if (text.includes(k)) score++ }
                return { a, score }
              }).filter(x => x.score > 0)
              scored.sort((x, y) => (y.score - x.score) || ((y.a.updatedAt||0) - (x.a.updatedAt||0)))
              const picks = scored.slice(0, 3).map(x => `- "${x.a.title}" (slug: ${x.a.slug})`).join('\n')
              const hint = picks ? `\n\nPossible matches:\n${picks}` : ''
              reply = `I couldn’t identify a specific article to update from that request. Please provide the slug or exact title.${hint}`
              bus.emit('toast', { message: 'No article update performed — need slug or exact title.', type: 'error' })
            } catch {
              reply = 'I couldn’t determine a specific action. Please provide the article slug or exact title.'
            }
          }
        } catch {
          reply = 'Sorry, I could not get a response right now.'
        }
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: c.messages.map(m => m.id === thinkingId ? { ...m, content: reply, typing: false, ts: Date.now() } : m) } : c))
      }
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
              {m.typing ? (
                <div className="typing">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              ) : (
                m.role === 'assistant' ? (
                  <div className="md">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}
                      components={{
                        a: (props: any) => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div>{m.content}</div>
                )
              )}
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
