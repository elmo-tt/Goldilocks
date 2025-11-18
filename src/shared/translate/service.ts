import { ArticlesStore, type Article } from '@/shared/articles/store'

const inflight = new Set<string>()

function pick(s?: string, max = 8000) {
  const x = String(s || '')
  return x.length > max ? x.slice(0, max) : x
}

function extractJson(s: string) {
  let txt = String(s || '').trim()
  const fence = txt.match(/```[a-zA-Z]*\n([\s\S]*?)```/)
  if (fence) txt = fence[1]
  const start = txt.indexOf('{')
  const end = txt.lastIndexOf('}')
  if (start >= 0 && end > start) txt = txt.slice(start, end + 1)
  try { return JSON.parse(txt) } catch { return null }
}

function paraCount(s?: string) {
  const x = String(s || '')
  return x.split(/\n{2,}|<\/p>|<br\s*\/?\s*>/i).filter(v => v && v.trim()).length
}

function isIncomplete(en?: string, es?: string) {
  const a = String(en || '').trim()
  const b = String(es || '').trim()
  if (!b) return true
  if (a.length > 1200 && b.length < a.length * 0.6) return true
  const pa = paraCount(a)
  const pb = paraCount(b)
  if (pa >= 4 && pb < Math.max(2, Math.floor(pa * 0.6))) return true
  return false
}

type TranslateStats = { byDay: Record<string, number>; lastRun?: number; provider?: string }
function dayKey(date?: Date) { const d = date || new Date(); return d.toISOString().slice(0, 10) }
function readStats(): TranslateStats { try { const raw = localStorage.getItem('gl_translate_stats'); const j = raw ? JSON.parse(raw) : null; return j && typeof j === 'object' && j.byDay ? j : { byDay: {} } } catch { return { byDay: {} } } }
function writeStats(s: TranslateStats) { try { localStorage.setItem('gl_translate_stats', JSON.stringify(s)) } catch {} }
export function getTranslateStats(): { today: number; lastRun?: number; provider?: string; limit: number } {
  const st = readStats()
  const today = st.byDay[dayKey()] || 0
  const lim = Number((import.meta as any).env?.VITE_TRANSLATE_DAILY_CHAR_LIMIT || 0) || 0
  return { today, lastRun: st.lastRun, provider: st.provider, limit: lim }
}
export function getDailyLimit(): number { return Number((import.meta as any).env?.VITE_TRANSLATE_DAILY_CHAR_LIMIT || 0) || 0 }
function recordUsage(chars: number, provider?: string) {
  const st = readStats()
  const k = dayKey()
  st.byDay[k] = (st.byDay[k] || 0) + Math.max(0, Math.floor(chars))
  st.lastRun = Date.now()
  if (provider) st.provider = provider
  writeStats(st)
}

export async function ensureSpanishForArticle(a: Article): Promise<boolean> {
  try {
    if (!a || inflight.has(a.id)) return false
    const hasBodyEs = !!(a as any).body_es
    const force = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('forceTranslate') === '1'
    const needs = !hasBodyEs || isIncomplete(a.body, (a as any).body_es)
    if (!force && !needs) return false
    inflight.add(a.id)
    const title = a.title || ''
    const excerpt = a.excerpt || ''
    const body = a.body || ''
    const estimateChars = (title + excerpt + body).length
    const lim = getDailyLimit()
    if (!force && lim > 0) {
      const used = getTranslateStats().today
      if (used + estimateChars > lim) { inflight.delete(a.id); return false }
    }
    const prompt = [
      'Translate the following article to Spanish (LATAM). Maintain Markdown structure, headings, links, and image references. Keep it concise and faithful. Return JSON only with keys: title, excerpt, body, metaTitle, metaDescription.',
      'English Title:', title,
      'English Excerpt:', pick(excerpt, 1000),
      'English Body:', body,
      'Respond with JSON only.'
    ].join('\n\n')
    const res = await fetch('/.netlify/functions/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'translate', max_tokens: 2000, temperature: 0.2, prompt })
    })
    if (!res.ok) {
      try {
        const txt = await res.text()
        // minimal client-side logging for debugging only
        console.error('[translate] copilot failed', res.status, txt)
      } catch {}
      inflight.delete(a.id)
      return false
    }
    const data = await res.json().catch(() => ({} as any))
    const content = String(data?.content || '')
    const provider = typeof data?.provider === 'string' ? data.provider : undefined
    const obj = extractJson(content)
    if (!obj || !obj.body) { inflight.delete(a.id); return false }
    // tiny debounce to avoid rapid double-saves
    await new Promise(r => setTimeout(r, 50))
    const next = {
      id: a.id,
      title_es: String(obj.title || '').trim() || a.title,
      excerpt_es: String(obj.excerpt || '').trim() || a.excerpt,
      body_es: String(obj.body || '').trim(),
      metaTitle_es: String(obj.metaTitle || '').trim() || undefined,
      metaDescription_es: String(obj.metaDescription || '').trim() || undefined,
    } as any
    ArticlesStore.save(next)
    recordUsage(estimateChars, provider)
    inflight.delete(a.id)
    return true
  } catch {
    inflight.delete(a.id)
    return false
  }
}
