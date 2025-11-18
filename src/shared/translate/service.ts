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

export async function ensureSpanishForArticle(a: Article): Promise<boolean> {
  try {
    if (!a || inflight.has(a.id)) return false
    const hasBodyEs = !!(a as any).body_es
    if (hasBodyEs) return false
    inflight.add(a.id)
    const title = a.title || ''
    const excerpt = a.excerpt || ''
    const body = a.body || ''
    const prompt = [
      'Translate the following article to Spanish (LATAM). Maintain Markdown structure, headings, links, and image references. Keep it concise and faithful. Return JSON only with keys: title, excerpt, body, metaTitle, metaDescription.',
      'English Title:', title,
      'English Excerpt:', pick(excerpt, 400),
      'English Body:', pick(body, 12000),
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
    inflight.delete(a.id)
    return true
  } catch {
    inflight.delete(a.id)
    return false
  }
}
