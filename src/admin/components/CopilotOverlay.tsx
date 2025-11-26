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

function removeExcerptLead(body: string, excerpt: string) {
  try {
    let text = String(body || '').replace(/\r\n?/g, '\n')
    const lines = text.split('\n')
    let idx = 0
    let header = ''
    if (lines.length && /^\s*#\s+/.test(lines[0])) {
      header = lines[0]
      idx = 1
      while (idx < lines.length && lines[idx].trim() === '') idx++
    }
    const paraLines: string[] = []
    while (idx < lines.length && lines[idx].trim() !== '') { paraLines.push(lines[idx]); idx++ }
    const para = stripMd(paraLines.join(' ').trim())
    const ex = stripMd(String(excerpt || ''))
    if (ex && para) {
      const p = para.toLowerCase()
      const e = ex.toLowerCase()
      if (p === e || p.startsWith(e)) {
      const rest = lines.slice(idx)
      while (rest.length && rest[0].trim() === '') rest.shift()
      const rebuilt = (header ? [header, '', ...rest] : rest).join('\n')
      return normalizeAiMarkdown(rebuilt)
      }
    }
  } catch {}
  return body
}

function buildExcerpt(excerptInput: string | undefined, bodyForFallback: string) {
  const maxLen = 180
  try {
    let ex = String(excerptInput || '').trim()
    if (ex) {
      ex = ex.replace(/^(?:\*\*\s*)?(?:Article\s*(?:Draft)?|Title|Excerpt|Body)\s*:\s*/i, '')
      ex = ex.replace(/Excerpt\s*:?:?\s*/i, '')
      ex = stripMd(ex)
      const parts = ex.split(/(?<=[.!?])\s+/).filter(Boolean)
      let out = ''
      let lastIdx = -1
      for (let i = 0; i < parts.length; i++) {
        const s = parts[i]
        if (isMetaSentence(s)) continue
        const cand = (out ? out + ' ' : '') + s.trim()
        if (cand.length > maxLen - 10) break
        out = cand
        lastIdx = i
        if (out.length >= 80) break
      }
      if (!out) out = compressSentence(ex, maxLen)
      else out = compressSentence(out, maxLen)
      if (/\b(of|for|with|on|in|to|into|onto|about|regarding|as|by|from)\.?$/i.test(out) && lastIdx >= 0 && parts[lastIdx + 1]) {
        const next = parts[lastIdx + 1].trim()
        if (next && !isMetaSentence(next)) out = compressSentence(`${out} ${next}`, maxLen)
      }
      return ensureSentence(out)
    }
    const noH1 = String(bodyForFallback || '').replace(/^\s*#{1,6}\s+[^\n]+\s*\n+/, '')
    const plain = stripMd(noH1)
    const parts = plain.split(/(?<=[.!?])\s+/).filter(Boolean)
    let out = ''
    let lastIdx = -1
    for (let i = 0; i < parts.length; i++) {
      const s = parts[i]
      if (isMetaSentence(s)) continue
      const cand = (out ? out + ' ' : '') + s.trim()
      if (cand.length > maxLen - 10) { break }
      out = cand
      lastIdx = i
      if (out.length >= 80) break
    }
    if (!out) out = compressSentence(parts[0] || plain, maxLen)
    else out = compressSentence(out, maxLen)
    if (/\b(of|for|with|on|in|to|into|onto|about|regarding|as|by|from)\.?$/i.test(out) && lastIdx >= 0 && parts[lastIdx + 1]) {
      const next = parts[lastIdx + 1].trim()
      if (next && !isMetaSentence(next)) out = compressSentence(`${out} ${next}`, maxLen)
    }
    return ensureSentence(out)
  } catch {
    return ensureSentence(ensureMaxLen(stripMd(String(excerptInput || bodyForFallback || '')), maxLen))
  }
}

function deriveKeyphrase(title: string, provided?: string, tags?: string[]) {
  const p = (provided || '').trim()
  if (p) return p
  const t = (tags && tags.find(x => x.trim().length >= 4)) || ''
  if (t) return t
  const raw = (title || '').toLowerCase()
  const words = raw.match(/[a-z0-9]+/g) || []
  const stop = new Set(['the','and','for','with','that','this','from','about','into','onto','within','your','you','our','are','will','can','how','what','why','when','of','a','in','their','its','current','administration','faces','today','latest','new','trump'])
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
  try {
    const lt = (title || '').toLowerCase()
    if (/\blegal\s+issues\b/.test(lt) && /\bmass\s+deportation\b/.test(lt)) {
      best = 'legal issues mass deportation'
    }
  } catch {}
  if (best) {
    best = best.replace(/\s+effort(s)?\b/i, '').trim()
    return best
  }
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
  x = x.replace(/^\s*\*{2,}\s+/gm, '')
  x = x.replace(/^\s*[*_]+\s*$/gm, '')
  x = x.replace(/\s+/g, ' ')
  return x.trim()
}

function ensureMaxLen(s: string, n: number) {
  if (!s) return ''
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  return cut.replace(/\s+\S*$/, '')
}

function smartTitle(s: string) {
  const minor = new Set(['and','or','the','a','an','of','for','to','in','on','at','by','from','with','vs','via'])
  const w = String(s || '').toLowerCase().split(/\s+/)
  const out = w.map((word, i) => {
    if (!word) return word
    const core = word.replace(/^(["'“”‘’(\[]?)(.*?)([)\]"'“”‘’.,:;!?]*)$/, '$2')
    const pre = word.slice(0, word.indexOf(core))
    const post = word.slice(pre.length + core.length)
    const cap = (!minor.has(core) || i === 0 || i === w.length - 1)
      ? core.charAt(0).toUpperCase() + core.slice(1)
      : core
    return pre + cap + post
  })
  return out.join(' ')
}

function ensureSentence(s: string) {
  let x = String(s || '').trim()
  x = trimTrailingWeak(x)
  if (!x) return x
  x = x.charAt(0).toUpperCase() + x.slice(1)
  if (!/[.!?]$/.test(x)) x += '.'
  return x
}

function polishSummary(s: string) {
  let x = String(s || '').trim()
  if (!x) return x
  x = x.replace(/\s*[:–—-]\s*$/, '')
  x = x.replace(/,?\s*(which|that)\s+(have|has|raise|raises|drawn|sparked|created|caused)\b[^.]*$/i, '')
  x = x.replace(/,?\s*(raising|prompting|sparking|fueling|triggering|leading\s+to|resulting\s+in|contributing\s+to)\s+[^.]*$/i, '')
  x = x.replace(/(?:,\s*)?(?:of|for|with|on|in|to|into|onto|about|regarding)\s+[^.]{0,30}$/i, '')
  x = x.replace(/\s+(?:of|for|with|on|in|to|into|onto|about|regarding)\s*(?:[.!?])?$/i, '')
  x = x.replace(/\s+(?:the|these|those|their|this|that)$/i, '')
  x = trimTrailingWeak(x)
  if (/\b(widespread|significant|numerous|serious|critical|major|severe|ongoing|substantial)\.?$/i.test(x)) {
    const cut = x.lastIndexOf(',')
    if (cut > 40) x = x.slice(0, cut)
  }
  x = x.replace(/\s+/g, ' ').trim()
  if (!/[.!?]$/.test(x)) x += '.'
  return x
}

function isMetaSentence(s: string) {
  return /^\s*(this\s+article|in\s+this\s+article|this\s+post|in\s+this\s+post|we\s+(?:discuss|explore|examine)|the\s+article)\b/i.test(String(s || ''))
}

function trimTrailingWeak(s: string) {
  let x = String(s || '').trim()
  x = x.replace(/\s+([.!?])$/, '$1')
  const preps = '(?:of|for|with|on|in|to|into|onto|about|regarding|as|by|from)'
  const dets = '(?:the|a|an|these|those|their|this|that|its)'
  for (let i = 0; i < 5; i++) {
    const before = x
    x = x.replace(/\s*(?:,|;|:)\s*$/, '')
    x = x.replace(new RegExp(`\n+$`), '')
    // Remove trailing "of (the|these|...)" patterns
    x = x.replace(new RegExp(`\s+${preps}\s+(?:${dets})\s*$`, 'i'), '')
    // Remove trailing single prep/det/conj words
    x = x.replace(new RegExp(`\s+(?:${preps}|${dets}|and|or|but|than)$`, 'i'), '')
    if (x === before) break
  }
  return x.trim()
}

function cutAtBoundary(s: string, maxLen: number) {
  const text = String(s || '').trim()
  if (text.length <= maxLen) return text
  const slice = text.slice(0, maxLen)
  const punct = Math.max(slice.lastIndexOf(','), slice.lastIndexOf(';'), slice.lastIndexOf('—'), slice.lastIndexOf('–'), slice.lastIndexOf(':'))
  let cut = punct >= 40 ? punct : slice.lastIndexOf(' ')
  if (cut < 40) cut = maxLen
  return slice.slice(0, cut).trim()
}

function compressSentence(s: string, maxLen: number) {
  let base = String(s || '').trim()
  // Prefer stopping at first full sentence if available
  const m = base.match(/^[\s\S]*?[.!?](?=\s|$)/)
  if (m) base = m[0].trim()
  if (base.length > maxLen) base = cutAtBoundary(base, maxLen)
  base = trimTrailingWeak(base)
  base = polishSummary(base)
  return ensureMaxLen(base, maxLen)
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
  title = smartTitle(title)
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
  // Ensure body has an H1 heading using the final title
  try {
    const hasH1 = /^\s*#\s+/.test(body.trim())
    if (!hasH1) {
      const base = smartTitle(kp)
      const tnorm = String(title || '').trim().toLowerCase()
      let variant = base
      if (base.length < 8 || base.toLowerCase() === tnorm) {
        variant = smartTitle(`${kp} — ${title}`)
      }
      body = `# ${variant}` + (body ? `\n\n${body}` : '')
    }
  } catch {}
  // Do not inject additional density lines; rely on authoring and CTA
  let metaTitleRaw = (input.metaTitle || title).trim()
  if (!new RegExp(`\\b${kp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(metaTitleRaw)) metaTitleRaw = `${kp} — ${metaTitleRaw}`
  let mtCandidate = smartTitle(ensureMaxLen(metaTitleRaw, 65))
  const awkwardEnd = /\b(the|a|an|and|or|of|with|for|to|in|on|their|these|this|current)$/i.test(mtCandidate)
  if ((mtCandidate.length >= 55 && /\s—\s/.test(mtCandidate)) || awkwardEnd) {
    const kpNorm = kp.toLowerCase()
    let alt = ''
    if (/\blegal\s+issues\b/.test(kpNorm) && /mass\s+deportation/.test(kpNorm)) alt = 'Legal Issues in Mass Deportation'
    else if (/mass\s+deportation/.test(kpNorm)) alt = 'Mass Deportation: Legal Issues'
    else alt = smartTitle(kp)
    if (alt && alt.length <= 60) mtCandidate = alt
  }
  let metaTitle = mtCandidate
  let metaDescription = (input.metaDescription || '').trim()
  if (!metaDescription) {
    const noH1 = body.replace(/^\s*#\s+[^\n]+\n?\n?/, '')
    const plain = stripMd(noH1)
    const parts = plain.split(/(?<=[.!?])\s+/).filter(Boolean)
    const maxLen = 160
    let desc = ''
    for (const s of parts) {
      if (isMetaSentence(s)) continue
      const cand = (desc ? desc + ' ' : '') + s.trim()
      if (cand.length > 150) break
      desc = cand
    }
    if (!desc) desc = compressSentence(plain, 155)
    // If too short, append next sentence if available
    if (desc.length < 60) {
      const idx = parts.findIndex(p => desc.includes(p.trim()))
      const next = idx >= 0 && parts[idx + 1] ? parts[idx + 1].trim() : ''
      if (next && !isMetaSentence(next)) {
        const joined = `${desc} ${next}`
        desc = compressSentence(joined, 155)
      }
    }
    const hasKp = new RegExp(`\\b${kp.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(desc)
    if (!hasKp) {
      const pref = `${kp} — `
      if ((pref + desc).length <= maxLen) desc = pref + desc
    }
    metaDescription = ensureMaxLen(desc, maxLen)
    metaDescription = ensureSentence(metaDescription)
  } else {
    metaDescription = ensureSentence(ensureMaxLen(metaDescription, 160))
  }
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
  s = s.replace(/^\s*\*{2,}\s+([^\n]+)/gm, '$1')
  s = s.replace(/^\s*[*_]+\s*$/gm, '')
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
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const [dragX, setDragX] = useState(0)
  const dragStart = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false })
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
    const onResize = () => { measure() }
    window.addEventListener('resize', onResize)
    // Observe input bar height changes (button wraps, safe-area, etc.)
    let ro: ResizeObserver | null = null
    try {
      if ('ResizeObserver' in window && inputBarRef.current) {
        ro = new ResizeObserver(() => measure())
        ro.observe(inputBarRef.current)
      }
    } catch {}
    const t = setTimeout(() => { measure() }, 0)
    return () => {
      window.removeEventListener('resize', onResize)
      try { ro?.disconnect() } catch {}
      clearTimeout(t)
    }
  }, [])

  // Removed focus-in autoscroll; sticky input handles visibility on mobile

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
        setTimeout(() => scrollToBottom(true), 0)
        break
      }
      case 'CONTACT': {
        reply = 'Opening contact form…'
        openSafe(CTA.contactUrl, '_blank')
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        setTimeout(() => scrollToBottom(true), 0)
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
        setTimeout(() => scrollToBottom(true), 0)
        break
      }
      case 'OPEN_PRACTICE': {
        reply = 'Opening practice page…'
        openSafe(cmd.url, '_blank')
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        setTimeout(() => scrollToBottom(true), 0)
        break
      }
      case 'CREATE_TASK': {
        const created = simulatePushTaskToFilevine(cmd.title)
        bus.emit('create-task', { title: created.title })
        reply = `Created task in Filevine: "${created.title}" (ID: ${created.id}).`
        doMinimize()
        setConvos(prev => prev.map(c => c.id === activeId ? { ...c, messages: [...c.messages, { id: newId('m'), role: 'assistant', content: reply, ts: Date.now() }] } : c))
        setTimeout(() => scrollToBottom(true), 0)
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
                let excerpt = String(c.args?.excerpt || '')
                const rawBody = String(c.args?.body || '')
                let body = normalizeAiMarkdown(rawBody)
                const tags = Array.isArray(c.args?.tags) ? c.args.tags.map((t: any) => String(t)).slice(0, 8) : []
                let keyphrase = c.args?.keyphrase ? String(c.args.keyphrase) : undefined
                let metaTitle = c.args?.metaTitle ? String(c.args.metaTitle) : undefined
                let metaDescription = c.args?.metaDescription ? String(c.args.metaDescription) : undefined
                let canonicalUrl = c.args?.canonicalUrl ? String(c.args.canonicalUrl) : undefined
                const noindex = typeof c.args?.noindex === 'boolean' ? Boolean(c.args.noindex) : undefined
                const status = (c.args?.status === 'published') ? 'published' : 'draft'
                try {
                  if (excerpt) {
                    let ex = String(excerpt || '').replace(/\r\n?/g, '\n').trim()
                    const mx = ex.match(/Excerpt\s*:?:?\s*([\s\S]*)/i)
                    if (mx && mx[1]) ex = mx[1].trim()
                    ex = ex.replace(/^\s*(?:\*\*\s*)?(?:Article\s*(?:Draft)?|Title|Excerpt|Body)\s*:\s*/gim, '')
                    excerpt = ensureMaxLen(stripMd(ex), 180)
                  } else {
                    const m = rawBody.match(/(?:^|\n)\s*(?:\*\*\s*)?Excerpt\s*:?:?\s*([\s\S]*?)(?:\n{2,}|(?:^|\n)\s*(?:\*\*\s*)?Body\s*:|$)/i)
                    if (m && m[1]) {
                      excerpt = ensureMaxLen(stripMd(m[1].trim()), 180)
                    }
                  }
                } catch {}
                // Sanitize body: drop label/meta lines and conversational prompts
                try {
                  body = body
                    .replace(/^\s*(?:\*\*\s*)?Article\s*(?:Draft)?\s*:\s*.*$/gim, '')
                    .replace(/^\s*(?:\*\*\s*)?Title\s*:\s*.*$/gim, '')
                    .replace(/^\s*(?:\*\*\s*)?Excerpt\s*:?:?\s*[\s\S]*?(?:\n{2,}|$)/gim, '')
                    .replace(/^\s*(?:\*\*\s*)?Body\s*:\s*/gim, '')
                    .replace(/^\s*Would you like me to create.*$/gim, '')
                    .replace(/^[^\n]*\bmin\s*read\b[^\n]*$/gim, '')
                    .replace(/^(?:\s)*(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}[^\n]*$/gim, '')
                  body = normalizeAiMarkdown(body)
                } catch {}
                // Prefer H1 or explicit Title/Article Draft in body as title when provided
                try {
                  const tAD = rawBody.match(/(?:^|\n)\s*(?:\*\*\s*)?Article\s*(?:Draft)?\s*:\s*(.+)/i)?.[1]?.trim()
                  const tT = rawBody.match(/(?:^|\n)\s*(?:\*\*\s*)?Title\s*:\s*(.+)/i)?.[1]?.trim()
                  const h1 = body.match(/^\s*#\s+(.+)$/m)?.[1]?.trim()
                  const bodyTitle = (tAD || tT || h1 || '').trim()
                  const cleanupTitle = (s: string) => s
                    .replace(/^\s*(please\s+)?(create|draft|write|generate|develop)\s+(?:an?\s+)?(?:[a-z]+\s+){0,6}?(article|post|blog)\s+(on|about|regarding|for)\s*/i, '')
                    .replace(/\s+(and|with)\s+(include|including)\b[\s\S]*$/i, '')
                    .replace(/\s+include\s+\d+\s+(citations?|sources?).*$/i, '')
                    .replace(/\s+with\s+\d+\s+(citations?|sources?).*$/i, '')
                    .replace(/\s+and\s+\d+\s+(citations?|sources?).*$/i, '')
                    .replace(/\s*[,;:–—-]\s*(include|including|with)\b[\s\S]*$/i, '')
                  const cleaned = cleanupTitle(title).trim()
                  const looksDirective = /^(please\s+)?(create|draft|write|generate|develop)\b/i.test(title)
                  if ((looksDirective || !cleaned || cleaned.toLowerCase() === (userMsg.content || '').trim().toLowerCase()) && bodyTitle && bodyTitle.length >= 6) {
                    title = bodyTitle
                  } else {
                    title = cleaned || title
                  }
                } catch {}
                // If excerpt is still empty, peel it from the raw body top block and remove that block from body
                try {
                  if (!excerpt && rawBody) {
                    const trimmedRaw = String(rawBody || '').replace(/\r\n?/g, '\n').trimStart()
                    const m = trimmedRaw.match(/^\s*(?:\*\*\s*)?Excerpt\s*:?:?\s*([\s\S]*?)(?:\n{2,}|\n\s*[-*_]{3,}\s*\n?|$)/i)
                    if (m && m[1]) {
                      excerpt = ensureMaxLen(stripMd(m[1].trim()), 180)
                      const after = trimmedRaw.slice(m[0].length).replace(/^\s+/, '')
                      body = normalizeAiMarkdown(after)
                      body = body
                        .replace(/^\s*(?:\*\*\s*)?Article\s*(?:Draft)?\s*:\s*.*$/gim, '')
                        .replace(/^\s*(?:\*\*\s*)?Title\s*:\s*.*$/gim, '')
                        .replace(/^\s*(?:\*\*\s*)?Body\s*:\s*/gim, '')
                    }
                  }
                } catch {}
                
                // Prefer H1 in body as title if present
                try {
                  const h1 = body.match(/^\s*#\s+(.+)$/m)?.[1]?.trim()
                  if (h1 && h1.length >= 6) title = h1
                } catch {}
                // Clean directive phrases from provided title like "and include 3 sources"
                try {
                  const cleanupTitle = (s: string) => s
                    .replace(/\s+(and|with)\s+(include|including)\b[\s\S]*$/i, '')
                    .replace(/\s+include\s+\d+\s+(citations?|sources?).*$/i, '')
                    .replace(/\s+with\s+\d+\s+(citations?|sources?).*$/i, '')
                    .replace(/\s+and\s+\d+\s+(citations?|sources?).*$/i, '')
                    .replace(/\s*[,;:–—-]\s*(include|including|with)\b[\s\S]*$/i, '')
                  title = cleanupTitle(title).trim() || title
                } catch {}
                // If the model placed an Excerpt block at the top of the body but did not fill the excerpt field,
                // peel it off into the excerpt and strip it from the body.
                try {
                  if (!excerpt && body) {
                    const trimmed = body.trimStart()
                    // Match patterns like "**Excerpt:** ..." or "Excerpt: ..." optionally followed by a separator line (---)
                    const m = trimmed.match(/^\s*(?:\*\*\s*)?Excerpt\s*:?:?\s*([\s\S]*?)(?:\s*\n\s*[-*_]{3,}\s*\n?|\s*\n\s*\n+)/i)
                    if (m && m[1]) {
                      const exText = m[1].trim()
                      if (exText) {
                        excerpt = exText
                        body = trimmed.slice(m[0].length).replace(/^\s+/, '')
                      }
                    }
                  }
                } catch {}
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
                const cleanExcerpt = buildExcerpt(excerpt, enforced.body)
                body = removeExcerptLead(enforced.body, cleanExcerpt)
                keyphrase = enforced.keyphrase
                metaTitle = enforced.metaTitle
                metaDescription = enforced.metaDescription
                const saved = ArticlesStore.save({ title, slug: enforced.slug, excerpt: cleanExcerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl, noindex, status })
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
          // If no tool calls were returned, attempt a local fallback. Avoid update heuristics when the user clearly asked to create an article.
          if (calls.length === 0) {
            try {
              const raw = userMsg.content || ''
              const recentCtx = (active.messages.slice(-3).map(m => m.content).join(' ') + ' ' + raw).toLowerCase()
              const wantsSEO = /\b(seo|meta\s*title|meta\s*description|key\s*phrase|keyphrase|canonical)\b/i.test(recentCtx)
              const mentionsArticle = /\b(article|post|blog)\b/i.test(recentCtx) || /slug:\s*[a-z0-9-]+/i.test(raw) || /"[^"]{5,}"/.test(raw)
              const wantsEdit = ((/(update|edit|modify|append|revise|publish|unpublish)\b/i.test(recentCtx) || wantsSEO) && mentionsArticle)
              const clearlyCreate = /\b(create|draft|write|generate|develop)\b[\s\S]*?\b(article|post|blog)\b/i.test(raw)

              // If the user clearly asked to create an article and we have no tool calls, synthesize a local draft
              // instead of showing an error message, even if earlier context mentioned updates/SEO.
              if (clearlyCreate) {
                try {
                  const qm = raw.match(/["'“”‘’]([^"'“”‘’]{5,})["'“”‘’]/)
                  let synthTitle = qm ? (qm[1] || '').trim() : ''
                  if (!synthTitle) {
                    const om = raw.match(/\bon\s+([^\n]{8,})$/i)
                    if (om && om[1]) synthTitle = om[1].trim()
                  }
                  if (!synthTitle) {
                    const stripped = raw.replace(/^(please\s+)?(create|draft|write|generate|develop)\s+(an?\s+)?(article|post|blog)\s+(on|about)\s*/i, '').trim()
                    synthTitle = stripped || 'New Article'
                  }
                  // Drop trailing directive phrases like 'and include 3 sources/citations'
                  try {
                    const cleanupTitle = (s: string) => s
                      .replace(/\s+(and|with)\s+(include|including)\b[\s\S]*$/i, '')
                      .replace(/\s+include\s+\d+\s+(citations?|sources?).*$/i, '')
                      .replace(/\s+with\s+\d+\s+(citations?|sources?).*$/i, '')
                      .replace(/\s+and\s+\d+\s+(citations?|sources?).*$/i, '')
                      .replace(/\s*[,;:–—-]\s*(include|including|with)\b[\s\S]*$/i, '')
                  synthTitle = cleanupTitle(synthTitle).trim()
                  } catch {}
                  const rawReply = String(reply || '')
                  let titleFromReply = ''
                  let excerptFromReply = ''
                  let bodyFromReply = ''
                  const mAD = rawReply.match(/(?:^|\n)\s*(?:\*\*\s*)?Article\s*(?:Draft)?\s*:\s*(.+)/i)
                  if (mAD && mAD[1]) titleFromReply = mAD[1].trim()
                  if (!titleFromReply) {
                    const mT = rawReply.match(/(?:^|\n)\s*(?:\*\*\s*)?Title\s*:\s*(.+)/i)
                    if (mT && mT[1]) titleFromReply = mT[1].trim()
                  }
                  if (!titleFromReply) {
                    const mH1 = rawReply.match(/^\s*#\s+(.+)$/m)
                    if (mH1 && mH1[1]) titleFromReply = mH1[1].trim()
                  }
                  const mEx = rawReply.match(/(?:^|\n)\s*(?:\*\*\s*)?Excerpt\s*:?:?\s*([\s\S]*?)(?:\n{2,}|(?:^|\n)\s*(?:\*\*\s*)?Body\s*:|$)/i)
                  if (mEx && mEx[1]) excerptFromReply = mEx[1].trim()
                  const mBody = rawReply.match(/(?:^|\n)\s*(?:\*\*\s*)?Body\s*:\s*([\s\S]+)/i)
                  bodyFromReply = (mBody && mBody[1]) ? mBody[1].trim() : rawReply
                  let draftBody = bodyFromReply
                    .replace(/^\s*(?:\*\*\s*)?Article\s*(?:Draft)?\s*:\s*.*$/gim, '')
                    .replace(/^\s*(?:\*\*\s*)?Title\s*:\s*.*$/gim, '')
                    .replace(/^\s*(?:\*\*\s*)?Excerpt\s*:?:?\s*[\s\S]*?(?:\n{2,}|$)/gim, '')
                    .replace(/^\s*(?:\*\*\s*)?Body\s*:\s*/gim, '')
                    .replace(/^\s*Would you like me to create.*$/gim, '')
                    .replace(/^[^\n]*\bmin\s*read\b[^\n]*$/gim, '')
                    .replace(/^(?:\s)*(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}[^\n]*$/gim, '')
                  draftBody = normalizeAiMarkdown(draftBody)
                  if (!draftBody) {
                    draftBody = [
                      `# ${titleFromReply || synthTitle}`,
                      '',
                      '## Key Changes and Legal Framework',
                      'Overview the core legal rules, recent developments, and practical impact on people affected by this topic. Explain what changed (if anything), why it matters, and who is covered.',
                      'Highlight how enforcement, deadlines, or evidentiary standards influence outcomes. Use plain language and provide concrete, real-world examples.',
                      '',
                      '## Timeline of Actions for Affected People',
                      '### Immediately',
                      'Ensure safety, document facts, and preserve evidence (photos, names, records). Start a simple log of dates, communications, and expenses.',
                      '### Within the First Week',
                      'Seek qualified guidance, collect official records, and follow professional recommendations. Avoid broad statements to opposing parties before you are prepared.',
                      '### Within the First Month',
                      'Organize documents and evaluate options. If deadlines apply, plan filing steps early so you do not lose rights. Consider a consultation to understand risks and next steps.',
                      '### Before Key Deadlines',
                      'If a legal deadline applies, act before it expires. Late action can limit or bar relief entirely.',
                      '',
                      '## How an Attorney Can Help',
                      'Experienced counsel can evaluate eligibility, gather evidence, manage communications, and build a persuasive case. They can also negotiate for resolution, or file and litigate to protect rights.',
                      'Where appropriate, they will coordinate with experts and help you avoid common pitfalls that weaken claims or defenses.',
                      '',
                      '## Hidden and Advanced Issues',
                      'Nuances like jurisdiction, administrative prerequisites, burden of proof, and evolving policies can change strategy. Exception scenarios and tolling can alter timelines — get tailored advice.',
                      '',
                      '## Frequently Asked Questions',
                      '### What happens if I miss a deadline?',
                      'Relief may be limited or denied. Act quickly and get specific advice on any possible exceptions.',
                      '### Can I move forward if I share some responsibility?',
                      'Often yes, but outcomes may be adjusted. Understand how fault or eligibility rules apply in your situation.',
                      '### What if my situation is still evolving?',
                      'Document everything and get counsel early. Filing or other steps can preserve rights while facts develop.',
                      '',
                      '## Pro Tips',
                      '- Keep a clean paper trail and save primary source documents.',
                      '- Avoid making broad public statements about your case or situation.',
                      '- Ask for written confirmation of key decisions and timelines.',
                    ].join('\n')
                  }
                  const cleanedSynthTitle = (() => {
                    const cleanup = (s: string) => s
                      .replace(/^\s*(please\s+)?(create|draft|write|generate|develop)\s+(?:an?\s+)?(?:[a-z]+\s+){0,6}?(article|post|blog)\s+(on|about|regarding|for)\s*/i, '')
                      .replace(/\s+(and|with)\s+(include|including)\b[\s\S]*$/i, '')
                      .replace(/\s+include\s+\d+\s+(citations?|sources?).*$/i, '')
                      .replace(/\s+with\s+\d+\s+(citations?|sources?).*$/i, '')
                      .replace(/\s+and\s+\d+\s+(citations?|sources?).*$/i, '')
                      .replace(/\s*[,;:–—-]\s*(include|including|with)\b[\s\S]*$/i, '')
                    return cleanup(synthTitle).trim() || synthTitle
                  })()
                  const chosenTitle = (titleFromReply || cleanedSynthTitle)
                  const enforced = enforceSeo({ title: chosenTitle, body: draftBody })
                  const origin = (typeof window !== 'undefined' ? window.location.origin : '')
                  const canonicalUrl = origin ? `${origin}/articles/${enforced.slug}` : `/articles/${enforced.slug}`
                  const excerpt = buildExcerpt(excerptFromReply, draftBody)
                  const finalBody = removeExcerptLead(enforced.body, excerpt)
                  const saved = ArticlesStore.save({
                    title: enforced.title,
                    slug: enforced.slug,
                    excerpt,
                    body: finalBody,
                    tags: [],
                    keyphrase: enforced.keyphrase,
                    metaTitle: enforced.metaTitle,
                    metaDescription: enforced.metaDescription,
                    canonicalUrl,
                    status: 'draft'
                  })
                  // Ensure canonical matches final slug if uniqueness adjusted
                  try {
                    const desired = origin ? `${origin}/articles/${saved.slug}` : `/articles/${saved.slug}`
                    if (saved.canonicalUrl !== desired) ArticlesStore.save({ id: saved.id, title: saved.title, slug: saved.slug, canonicalUrl: desired })
                  } catch {}
                  onNavigate('articles', { minimize: autoMinimize })
                  reply = `Created draft article “${saved.title}”.`
                  try { bus.emit('toast', { message: reply, type: 'success' }) } catch {}
                } catch {
                  reply = 'I couldn’t automatically create that article from this request.'
                }
              } else {
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
          <div ref={endRef} style={{ height: 'calc(var(--copilot-inpb, 72px) + env(safe-area-inset-bottom) + 16px)', scrollMarginBottom: 'calc(var(--copilot-inpb, 72px) + env(safe-area-inset-bottom) + 16px)' }} />
        </div>

        <div className="input-bar" ref={inputBarRef}>
          <input className="input" placeholder="Ask anything or use /overview /intake /cases /tasks /calendar /marketing /settings, /call, /contact, /map wpb|psl, /task 'Call client'" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} />
          <button className="ops-btn" onClick={send}><Send size={16} /> Send</button>
        </div>
      </main>

      <div className={`copilot-scrim${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div
        className={`copilot-drawer${drawerOpen ? ' open' : ''}${dragX !== 0 ? ' dragging' : ''}`}
        role="dialog"
        aria-modal="true"
        ref={drawerRef}
        style={{ transform: drawerOpen && dragX < 0 ? `translateX(${dragX}px)` : undefined, touchAction: 'pan-y' as any }}
        onTouchStart={(e) => {
          if (!drawerOpen) return
          const t = e.touches[0]
          dragStart.current = { x: t.clientX, y: t.clientY, active: true }
          setDragX(0)
        }}
        onTouchMove={(e) => {
          if (!dragStart.current.active) return
          const t = e.touches[0]
          const dx = t.clientX - dragStart.current.x
          const dy = t.clientY - dragStart.current.y
          if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return
          setDragX(Math.min(0, dx))
        }}
        onTouchEnd={() => {
          if (!dragStart.current.active) return
          const w = drawerRef.current?.offsetWidth || 320
          const shouldClose = dragX < -Math.min(120, w * 0.33)
          if (shouldClose) setDrawerOpen(false)
          setDragX(0)
          dragStart.current.active = false
        }}
        onTouchCancel={() => { setDragX(0); dragStart.current.active = false }}
      >
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
              <button onClick={() => { setActiveId(c.id) }} className={`list-item${c.id === activeId ? ' active' : ''}`} style={{ minWidth: 0 }}>
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
