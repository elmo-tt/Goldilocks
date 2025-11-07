import { useEffect, useMemo, useRef, useState } from 'react'
import type { NavId } from '../utils/intentParser'
import { parseCommand } from '../utils/intentParser'
import { CTA, OFFICES, PRACTICE_AREAS } from '../data/goldlaw'
import { ArticlesStore, slugify } from '../../shared/articles/store'
import { getBackend } from '../../shared/config'
import { CloudArticlesStore } from '../../shared/articles/cloud'
import { simulatePushTaskToFilevine } from '../data/integrations'
import { bus } from '../utils/bus'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PanelLeft, Plus, X, Send, Bot, Trash2 } from 'lucide-react'

export type Message = { id: string; role: 'user' | 'assistant'; content: string; ts: number; typing?: boolean }

function deriveKeyphrase(title: string, provided?: string, tags?: string[]) {
  const p = (provided || '').trim()
  if (p) return p
  const t = (tags && tags.find(x => x.trim().length >= 4)) || ''
  if (t) return t
  const raw = (title || '').toLowerCase()
  const words = raw.match(/[a-z0-9]+/g) || []
  const stop = new Set(['the','and','for','with','that','this','from','about','into','onto','within','your','you','our','are','will','can','how','what','why','when','of','a','in'])
  const slug = slugify(title || '').replace(/-/g, ' ')
  const cands: string[] = []
  // collect trigrams and bigrams (prefer contiguous phrases from the title)
  for (let n = 3; n >= 2; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const seq = words.slice(i, i + n).join(' ')
      cands.push(seq)
    }
  }
  let best = ''
  let bestScore = -1
  for (const c of cands) {
    const toks = c.split(' ')
    const content = toks.filter(w => w.length >= 3 && !stop.has(w)).length
    if (content === 0) continue
    let s = content * 10
    if (slug.includes(c)) s += 50
    if (toks.length === 2) s += 5
    if (s > bestScore) { bestScore = s; best = c }
  }
  if (best) return best
  const picks = words.filter(w => w.length >= 4 && !stop.has(w)).slice(0, 3)
  return picks.join(' ').trim() || (title || '').trim()
}

function stripMd(s: string) {
  let x = String(s || '')
  x = x.replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ')
  x = x.replace(/\!\[[^\]]*\]\([^\)]*\)/g, ' ')
  x = x.replace(/\[[^\]]*\]\([^\)]*\)/g, ' ')
  x = x.replace(/^>\s+/gm, ' ')
  x = x.replace(/^\s{0,3}[-*+]\s+/gm, ' ')
  x = x.replace(/^\s*\d+\.\s+/gm, ' ')
  x = x.replace(/^#{1,6}\s+/gm, ' ')
  x = x.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
  x = x.replace(/\s+/g, ' ')
  return x.trim()
}

function ensureMaxLen(s: string, n: number) {
  if (!s) return ''
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  return cut.replace(/\s+\S*$/, '')
}

function norm(s: string) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() }
function sanitizeAreaLabel(s: string) { return String(s || '').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim() }
function transformAreaLabelForCta(label: string) {
  const clean = sanitizeAreaLabel(label)
  const n = clean.toLowerCase()
  if (n === 'premises liability') return 'Negligent Security'
  if (n === 'human trafficking liability') return 'Human Trafficking'
  return clean
}
function findPracticeAreaLabel(tags?: string[], keyphraseOrTitle?: string, context?: string) {
  try {
    const candidates: string[] = []
    if (Array.isArray(tags)) for (const t of tags) if (t && t.trim()) candidates.push(t)
    if (keyphraseOrTitle && keyphraseOrTitle.trim()) candidates.push(keyphraseOrTitle)
    if (context && context.trim()) candidates.push(context.slice(0, 800))
    const candN = candidates.map(norm)
    const aliases: Array<{ target: string; patterns: string[] }> = [
      { target: 'Trucking Accidents', patterns: ['truck accident', 'truck accidents', 'trucking accident', 'trucking accidents', 'semi truck', 'tractor trailer', '18 wheeler'] },
      { target: 'Negligent Security', patterns: ['negligent security', 'inadequate security', 'premises security'] },
    ]
    let bestLabel: string | undefined
    let bestScore = 0
    const score = (label: string, c: string) => {
      const ln = norm(label)
      if (!ln || !c) return 0
      if (c === ln) return 95
      if (c.includes(ln)) return 90
      const toks = ln.split(' ').filter(Boolean)
      let hits = 0
      for (const tk of toks) if (c.includes(tk)) hits++
      const ratio = toks.length ? hits / toks.length : 0
      return Math.round(60 + 30 * ratio + Math.min(10, toks.length))
    }
    for (const c of candN) {
      for (const a of aliases) {
        for (const p of a.patterns) {
          const pn = norm(p)
          if (pn && c.includes(pn)) {
            const sc = 100
            if (sc > bestScore) { bestScore = sc; bestLabel = a.target }
          }
        }
      }
      for (const pa of PRACTICE_AREAS) {
        const sc = score(pa.label, c)
        if (sc > bestScore) { bestScore = sc; bestLabel = pa.label }
      }
    }
    return bestLabel
  } catch {}
  return undefined
}

function enforceSeo(input: { title: string; body: string; metaTitle?: string; metaDescription?: string; keyphrase?: string; tags?: string[]; canonicalUrl?: string; }) {
  const kp = deriveKeyphrase(input.title, input.keyphrase, input.tags)
  let title = input.title || 'Untitled'
  if (!new RegExp(`\\b${kp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(title)) {
    title = `${kp.charAt(0).toUpperCase()}${kp.slice(1)} — ${title}`
  }
  let slug = slugify(`${title} ${kp}`)
  let body = input.body || ''
  // Remove generic headings like Introduction/Conclusion even if not marked with '#'
  body = body
    .replace(/^\s*(?:#{1,6}\s*)?(Introduction|Conclusion|Excerpt|Sources|References)\s*:?\s*$/gim, '')
    .replace(/^\s*(?:#{1,6}\s*)?Article\s*:\s*.*$/gim, '')
    .replace(/^\s*.*\bin focus:\b.*$/gim, '')
    .replace(/^\s*.*—\s*Article\s*:\s*.*$/gim, '')
    .replace(/^\s*Further guidance on\s+.*$/gim, '')
    .replace(/^(\s*(?:#{1,6}\s*)?[^\n]+?)\s[–—-]\s*(Introduction|Conclusion)\s*$/gim, '$1')
    .replace(/\n{3,}/g, '\n\n')
  try {
    const blocks = body.split(/\n\n+/)
    const out: string[] = []
    let prev = ''
    for (const b of blocks) {
      const norm = b.replace(/\s+/g, ' ').trim().toLowerCase()
      if (!norm) continue
      if (norm === prev) continue
      out.push(b)
      prev = norm
    }
    if (out.length) body = out.join('\n\n')
  } catch {}
  // Do not inject additional density lines; rely on authoring and CTA
  let metaTitle = (input.metaTitle || title).trim()
  if (!new RegExp(`\\b${kp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(metaTitle)) metaTitle = `${kp} — ${metaTitle}`
  metaTitle = ensureMaxLen(metaTitle, 65)
  let metaDescription = (input.metaDescription || '').trim()
  if (!metaDescription) {
    const base = stripMd(body).slice(0, 140).replace(/\s+\S*$/, '')
    metaDescription = `${kp}: ${base}`
  }
  if (!new RegExp(`\\b${kp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(metaDescription)) metaDescription = `${kp}: ` + metaDescription
  metaDescription = ensureMaxLen(metaDescription, 160)
  const matchedLabel = findPracticeAreaLabel(input.tags, kp, input.body)
  const displayLabel = matchedLabel ? transformAreaLabelForCta(matchedLabel).toLowerCase() : ''
  const cta = matchedLabel
    ? `If you or someone you know has been a victim of ${displayLabel}, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
    : `If you need legal guidance regarding this topic, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
  const trimmed = body.replace(/\s+$/, '')
  if (!trimmed.toLowerCase().endsWith(cta.toLowerCase())) {
    body = trimmed + `\n\n` + cta
  } else {
    body = trimmed
  }
  return { title, slug, body, metaTitle, metaDescription, keyphrase: kp }
}
export type Conversation = { id: string; title: string; messages: Message[] }

function newId(prefix = 'id') { return prefix + '-' + Math.random().toString(36).slice(2, 9) }

function summarizeTitle(text: string) {
  const t = text.trim()
  if (!t) return 'New chat'
  return t.length > 40 ? t.slice(0, 40) + '…' : t
}

// Clean and normalize Markdown returned by the model so the source data is well-structured
function normalizeAiMarkdown(text: string) {
  if (!text) return ''
  let s = text.replace(/\r\n?/g, '\n')
  // Convert list markers like "1) " to "1. " when at line start
  s = s.replace(/(^|\n)\s*(\d+)\)\s+/g, '$1$2. ')
  // Ensure ordered list markers and bullets start at a new line (if they appeared inline)
  s = s.replace(/([^\n])\s+(\d+)\.\s/g, '$1\n$2. ')
  s = s.replace(/([^\n])\s+-\s/g, '$1\n- ')
  s = s.replace(/([^\n])\s+\*\s/g, '$1\n* ')
  // Ensure a blank line before list blocks for proper Markdown parsing
  s = s.replace(/([^\n])\n(\s*(?:- |\d+\. ))/g, '$1\n\n$2')
  // Normalize multiple blank lines to max two
  s = s.replace(/\n{3,}/g, '\n\n')
  // Trim trailing spaces on lines
  s = s.replace(/[\t ]+$/gm, '')
  return s.trim()
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
  const inputBarRef = useRef<HTMLDivElement | null>(null)
  const [inputH, setInputH] = useState(72)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)
  // Inline rename state for chat titles
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

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

  const scrollToBottom = (smooth = false) => {
    const el = messagesRef.current
    const end = endRef.current
    if (!el) return
    try {
      if (end && end.scrollIntoView) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try { end.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' }) } catch {}
            try { (el as any).scrollTo ? (el as any).scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' }) : (el.scrollTop = el.scrollHeight) } catch { el.scrollTop = el.scrollHeight }
          })
        })
      } else {
        el.scrollTop = el.scrollHeight
      }
    } catch {}
  }
  const ensureBottom = (tries = 6, delay = 60) => {
    try {
      scrollToBottom(false)
      if (tries <= 1) return
      let t = 1
      const tick = () => {
        scrollToBottom(false)
        if (++t <= tries) setTimeout(tick, delay)
      }
      setTimeout(tick, delay)
    } catch {}
  }
  // Auto-scroll to bottom on new messages / layout changes
  useEffect(() => { scrollToBottom(false) }, [active.messages.length, activeId, open, inputH])

  // Also react to changes in the last message content/typing (length may stay the same)
  const lastMsg = active.messages[active.messages.length - 1]
  useEffect(() => { scrollToBottom(false) }, [lastMsg?.content, lastMsg?.typing])

  useEffect(() => {
    const measure = () => {
      try { setInputH(inputBarRef.current?.offsetHeight || 72) } catch { setInputH(72) }
    }
    measure()
    const onResize = () => { measure(); ensureBottom(4, 50) }
    window.addEventListener('resize', onResize)
    // iOS/mobile: visual viewport changes when keyboard shows/hides
    const vv = (window as any).visualViewport as any | undefined
    const onVv = () => { measure(); ensureBottom(5, 60) }
    try { vv?.addEventListener('resize', onVv); vv?.addEventListener('scroll', onVv) } catch {}
    // Observe input bar height changes (button wraps, safe-area, etc.)
    let ro: ResizeObserver | null = null
    try {
      if ('ResizeObserver' in window && inputBarRef.current) {
        ro = new ResizeObserver(() => measure())
        ro.observe(inputBarRef.current)
      }
    } catch {}
    const t = setTimeout(() => { measure(); ensureBottom(4, 50) }, 0)
    return () => {
      window.removeEventListener('resize', onResize)
      try { vv?.removeEventListener('resize', onVv); vv?.removeEventListener('scroll', onVv) } catch {}
      try { ro?.disconnect() } catch {}
      clearTimeout(t)
    }
  }, [])

  // Ensure latest message remains visible when the input receives focus (mobile keyboard up)
  useEffect(() => {
    const onFocusIn = (e: Event) => {
      if (inputBarRef.current && (e.target instanceof Element) && inputBarRef.current.contains(e.target)) {
        requestAnimationFrame(() => { requestAnimationFrame(() => ensureBottom(5, 60)) })
      }
    }
    window.addEventListener('focusin', onFocusIn)
    return () => { window.removeEventListener('focusin', onFocusIn) }
  }, [])

  if (!open) return null

  const send = async () => {
    const text = input.trim()
    if (!text) return
    const userMsg: Message = { id: newId('m'), role: 'user', content: text, ts: Date.now() }
    const cmd = parseCommand(text, PRACTICE_AREAS)
    setConvos(prev => prev.map(c => c.id === activeId ? { ...c, title: c.messages.length <= 1 ? summarizeTitle(text) : c.title, messages: [...c.messages, userMsg] } : c))
    setTimeout(() => scrollToBottom(true), 0)
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
        setTimeout(() => scrollToBottom(true), 0)
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
        setTimeout(() => scrollToBottom(true), 0)
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
                let title = String(c.args?.title || 'Untitled')
                const excerpt = String(c.args?.excerpt || '')
                let body = normalizeAiMarkdown(String(c.args?.body || ''))
                const tags = Array.isArray(c.args?.tags) ? c.args.tags.map((t: any) => String(t)).slice(0, 8) : []
                let keyphrase = c.args?.keyphrase ? String(c.args.keyphrase) : undefined
                let metaTitle = c.args?.metaTitle ? String(c.args.metaTitle) : undefined
                let metaDescription = c.args?.metaDescription ? String(c.args.metaDescription) : undefined
                let canonicalUrl = c.args?.canonicalUrl ? String(c.args.canonicalUrl) : undefined
                const noindex = typeof c.args?.noindex === 'boolean' ? Boolean(c.args.noindex) : undefined
                const status = (c.args?.status === 'published') ? 'published' : 'draft'
                const baseSlug = slugify(title)
                // Extract SEO lines if the model placed them in the body
                try {
                  const mt = body.match(/^\s*Meta\s*Title\s*:\s*(.+)$/im)?.[1]?.trim()
                  const md = body.match(/^\s*Meta\s*Description\s*:\s*(.+)$/im)?.[1]?.trim()
                  const kp = (body.match(/^\s*(Keyphrase|Focus\s*keyphrase)\s*:\s*(.+)$/im)?.[2] || '').trim()
                  const cu = body.match(/^\s*Canonical\s*URL\s*:\s*(.+)$/im)?.[1]?.trim()
                  if (!metaTitle && mt) metaTitle = mt
                  if (!metaDescription && md) metaDescription = md
                  if (!keyphrase && kp) keyphrase = kp
                  if (!canonicalUrl && cu) canonicalUrl = cu
                  // Remove SEO block lines and heading from body
                  body = body
                    .replace(/^\s*#{0,3}\s*SEO\s+Optimization\s*$/gim, '')
                    .replace(/^\s*(Meta\s*Title|Meta\s*Description|Keyphrase|Focus\s*keyphrase|Canonical\s*URL)\s*:\s*.+$/gim, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim()
                } catch {}
                // Default canonical to this site's article URL (avoid external source URL)
                try {
                  const origin = (typeof window !== 'undefined' ? window.location.origin : '')
                  const looksExternal = (u: string) => /^https?:\/\//i.test(u) && origin && !u.startsWith(origin)
                  if (!canonicalUrl || looksExternal(canonicalUrl)) {
                    canonicalUrl = origin ? `${origin}/articles/${baseSlug}` : `/articles/${baseSlug}`
                  }
                } catch {}
                // Enforce SEO rules on the final content and fields
                const enforced = enforceSeo({ title, body, metaTitle, metaDescription, keyphrase, tags, canonicalUrl })
                title = enforced.title
                body = enforced.body
                keyphrase = enforced.keyphrase
                metaTitle = enforced.metaTitle
                metaDescription = enforced.metaDescription
                const saved = ArticlesStore.save({ title, slug: enforced.slug, excerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl, noindex, status })
                // If slug changed due to uniqueness, correct canonical to the final slug
                try {
                  const origin = (typeof window !== 'undefined' ? window.location.origin : '')
                  const desired = origin ? `${origin}/articles/${saved.slug}` : `/articles/${saved.slug}`
                  if (saved.canonicalUrl !== desired) {
                    ArticlesStore.save({ id: saved.id, title: saved.title, canonicalUrl: desired })
                  }
                } catch {}
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
                  if (typeof c.args?.body === 'string') {
                    const normalized = normalizeAiMarkdown(String(c.args.body))
                    const enforced = enforceSeo({
                      title: fields.title,
                      body: normalized,
                      metaTitle: fields.metaTitle,
                      metaDescription: fields.metaDescription,
                      keyphrase: fields.keyphrase,
                      tags: Array.isArray(fields.tags) ? fields.tags : art.tags,
                      canonicalUrl: fields.canonicalUrl,
                    })
                    fields.title = enforced.title
                    fields.body = enforced.body
                    fields.keyphrase = enforced.keyphrase
                    fields.metaTitle = enforced.metaTitle
                    fields.metaDescription = enforced.metaDescription
                    // Note: slug remains existing unless explicitly changing slug elsewhere
                  }
                  if (Array.isArray(c.args?.tags)) fields.tags = c.args.tags.map((t: any) => String(t)).slice(0, 8)
                  if (typeof c.args?.keyphrase === 'string') fields.keyphrase = String(c.args.keyphrase)
                  if (typeof c.args?.metaTitle === 'string') fields.metaTitle = String(c.args.metaTitle)
                  if (typeof c.args?.metaDescription === 'string') fields.metaDescription = String(c.args.metaDescription)
                  if (typeof c.args?.canonicalUrl === 'string') fields.canonicalUrl = String(c.args.canonicalUrl)
                  if (typeof c.args?.noindex === 'boolean') fields.noindex = Boolean(c.args.noindex)
                  if (c.args?.status === 'published' || c.args?.status === 'draft') fields.status = c.args.status

                  // Auto-generate SEO fields if the user intent mentions SEO/meta but the model didn't provide values.
                  const wantsSEO = /\b(seo|meta\s*title|meta\s*description|key\s*phrase|keyphrase|canonical)\b/i.test(userMsg.content || '')
                  if (wantsSEO) {
                    const baseTitle = (fields.metaTitle || providedTitle || art.metaTitle || art.title || '').trim()
                    const max60 = (s: string) => s.length > 60 ? s.slice(0, 60).replace(/\s+\S*$/, '') : s
                    const stripHtml = (s: string) => String(s || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                    const bodyText = stripHtml(fields.body ?? art.body)
                    const baseDesc = (fields.metaDescription || art.metaDescription || art.excerpt || bodyText.slice(0, 180))
                    const max155 = (s: string) => s.length > 155 ? s.slice(0, 155).replace(/\s+\S*$/, '') : s
                    const kp = deriveKeyphrase(providedTitle || art.title || '', undefined, Array.isArray(fields.tags) ? fields.tags : art.tags)
                    const origin = (typeof window !== 'undefined' ? window.location.origin : '')
                    const canon = `${origin || ''}/articles/${art.slug}`
                    const ensureHas = (text: string, key: string) => {
                      const t = (text || '').toLowerCase().replace(/[-_]+/g, ' ')
                      const ks = (key || '').toLowerCase().match(/[a-z0-9]+/g) || []
                      if (ks.length === 0) return false
                      const pattern = new RegExp(`(^|[^a-z0-9])${ks.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^a-z0-9]+')}([^a-z0-9]|$)`, 'i')
                      return pattern.test(t)
                    }
                    if (!fields.metaTitle && baseTitle) {
                      const next = ensureHas(baseTitle, kp) ? baseTitle : `${kp.charAt(0).toUpperCase()}${kp.slice(1)} — ${baseTitle}`
                      fields.metaTitle = max60(next)
                    }
                    if (!fields.metaDescription && baseDesc) {
                      const nextDesc = ensureHas(baseDesc, kp) ? baseDesc : `${kp}: ${baseDesc}`
                      fields.metaDescription = max155(nextDesc)
                    }
                    if (!fields.keyphrase && kp) fields.keyphrase = kp
                    if (!fields.canonicalUrl) fields.canonicalUrl = canon
                  }
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
          // If no tool calls were returned, attempt a local fallback to identify and update an article when the user intent indicates edits/SEO.
          if (calls.length === 0) {
            try {
              const raw = userMsg.content || ''
              const recentCtx = (active.messages.slice(-3).map(m => m.content).join(' ') + ' ' + raw).toLowerCase()
              const wantsSEO = /\b(seo|meta\s*title|meta\s*description|key\s*phrase|keyphrase|canonical)\b/i.test(recentCtx)
              const mentionsArticle = /\b(article|post)\b/i.test(recentCtx) || /slug:\s*[a-z0-9-]+/i.test(raw) || /"[^"]{5,}"/.test(raw)
              const wantsEdit = ((/(update|edit|modify|append|revise|publish|unpublish)\b/i.test(recentCtx) || wantsSEO) && mentionsArticle)
              // Try slug pattern first
              let art = undefined as undefined | ReturnType<typeof ArticlesStore.getBySlug>
              const sm = raw.match(/slug:\s*([a-z0-9-]+)/i)
              if (sm && sm[1]) art = ArticlesStore.getBySlug(sm[1].trim())
              // Try quoted exact title
              if (!art) {
                const qm = raw.match(/[\"]([^\"“”]{5,})[\"]/)
                const title = qm ? (qm[1] || '').trim() : ''
                if (title) {
                  const all = ArticlesStore.all()
                  art = all.find(a => a.title.toLowerCase() === title.toLowerCase()) || all.find(a => a.title.toLowerCase().includes(title.toLowerCase()))
                }
              }
              // Supabase fallback by slug
              if (!art && sm && sm[1] && getBackend() === 'supabase') {
                try { art = await CloudArticlesStore.getBySlug(sm[1].trim()) as any } catch {}
              }
              if (art && wantsEdit) {
                const fields: any = { id: art.id, slug: art.slug, title: art.title }
                // Auto-generate SEO fields
                const baseTitle = (art.metaTitle || art.title || '').trim()
                const max60 = (s: string) => s.length > 60 ? s.slice(0, 60).replace(/\s+\S*$/, '') : s
                const stripHtml = (s: string) => String(s || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
                const bodyText = stripHtml(art.body)
                const baseDesc = (art.metaDescription || art.excerpt || bodyText.slice(0, 180))
                const max155 = (s: string) => s.length > 155 ? s.slice(0, 155).replace(/\s+\S*$/, '') : s
                const tokens = Array.from(new Set(((art.title || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length >= 4 && !['the','and','for','with','that','this','from','about','into','onto','within','your','you','our','are','will'].includes(w))))
                const kp = tokens.slice(0, 3).join(' ')
                const origin = (typeof window !== 'undefined' ? window.location.origin : '')
                const canon = `${origin || ''}/articles/${art.slug}`
                fields.metaTitle = max60(baseTitle)
                fields.metaDescription = max155(baseDesc)
                fields.keyphrase = kp
                fields.canonicalUrl = canon
                ArticlesStore.save(fields)
                onNavigate('articles', { minimize: autoMinimize })
                const note = `Updated article “${fields.title}”.`
                try { bus.emit('toast', { message: note, type: 'success' }) } catch {}
                reply = note
              }
              if (!reply) {
                if (!wantsEdit) {
                  reply = 'How can I help? You can ask me to navigate, create or update tasks, or draft/edit articles.'
                } else {
                  const rawLower = raw.toLowerCase()
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
                }
              }
            } catch {
              reply = 'I couldn’t determine a specific action. Please provide the article slug or exact title.'
            }
          }
        } catch {
          reply = 'Sorry, I could not get a response right now.'
        }
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: c.messages.map(m => m.id === thinkingId ? { ...m, content: reply, typing: false, ts: Date.now() } : m) } : c))
        setTimeout(() => scrollToBottom(true), 0)
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
    <div className="copilot-overlay" style={{ ['--copilot-inpb' as any]: `${inputH}px` }}>
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
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr min-content', alignItems: 'center' }}>
              <button onClick={() => setActiveId(c.id)} className={`list-item${c.id === activeId ? ' active' : ''}`} style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={16} />
                  <div style={{ minWidth: 0 }}>
                    {renamingId === c.id ? (
                      <input
                        value={renameValue}
                        autoFocus
                        onClick={e => e.stopPropagation()}
                        onChange={e => setRenameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const v = (renameValue || '').trim() || 'New chat'
                            setConvos(prev => prev.map(x => x.id === c.id ? { ...x, title: v } : x))
                            setRenamingId(null)
                          } else if (e.key === 'Escape') {
                            setRenamingId(null)
                          }
                        }}
                        onBlur={() => {
                          const v = (renameValue || '').trim() || c.title || 'New chat'
                          setConvos(prev => prev.map(x => x.id === c.id ? { ...x, title: v } : x))
                          setRenamingId(null)
                        }}
                        style={{ height: 24, padding: '2px 6px', fontWeight: 600, border: '1px solid var(--ops-border)', borderRadius: 6, background: 'transparent', color: 'var(--ops-text)', margin: '0 0 2px' }}
                      />
                    ) : (
                      <div
                        style={{ fontWeight: 600, cursor: 'text', margin: '0 0 2px' }}
                        onClick={e => {
                          e.stopPropagation()
                          setActiveId(c.id)
                          setRenamingId(c.id)
                          setRenameValue(c.title || '')
                        }}
                      >
                        {c.title}
                      </div>
                    )}
                    <div className="copilot-excerpt" style={{ width: '32ch', marginTop: 0 }}>{c.messages[c.messages.length - 1]?.content || ''}</div>
                  </div>
                </div>
              </button>
              <button className="icon-btn danger" onClick={() => deleteChat(c.id)} title="Delete chat" style={{ marginLeft: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      <main className="copilot-main">
        <div className="bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="copilot-menu" aria-label="Open chats" onClick={() => setDrawerOpen(true)}>
              <PanelLeft size={18} />
            </button>
            <Bot size={18} />
            <strong>GOLDLAW Copilot</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ops-muted)' }}>
              <input type="checkbox" checked={autoMinimize} onChange={e => setAutoMinimize(e.target.checked)} />
              Auto-minimize on navigate
            </label>
            <button className="copilot-min" onClick={onClose} title="Minimize"><X size={16} /></button>
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
          <div ref={endRef} style={{ height: 'calc(var(--copilot-inpb, 72px) + 16px)', scrollMarginBottom: 'calc(var(--copilot-inpb, 72px) + 16px)' }} />
        </div>

        <div className="input-bar" ref={inputBarRef}>
          <input className="input" placeholder="Ask anything or use /overview /intake /cases /tasks /calendar /marketing /settings, /call, /contact, /map wpb|psl, /task 'Call client'" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
          <button className="ops-btn" onClick={send}><Send size={16} /> Send</button>
        </div>
      </main>

      <div className={`copilot-scrim${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`copilot-drawer${drawerOpen ? ' open' : ''}`} role="dialog" aria-modal="true">
        <div className="drawer-head">
          <strong>Chats</strong>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="ops-btn" onClick={newChat} title="New chat"><Plus size={16} /> New</button>
            <button className="copilot-min" onClick={() => setDrawerOpen(false)} title="Close"><X size={16} /></button>
          </div>
        </div>
        <div className="copilot-list">
          {convos.map(c => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr min-content', alignItems: 'center' }}>
              <button onClick={() => { setActiveId(c.id); setDrawerOpen(false) }} className={`list-item${c.id === activeId ? ' active' : ''}`} style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={16} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, cursor: 'pointer', margin: '0 0 2px' }}>{c.title}</div>
                    <div className="copilot-excerpt" style={{ width: '28ch', marginTop: 0 }}>{c.messages[c.messages.length - 1]?.content || ''}</div>
                  </div>
                </div>
              </button>
              <button className="icon-btn danger" onClick={() => deleteChat(c.id)} title="Delete chat" style={{ marginLeft: 0 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
