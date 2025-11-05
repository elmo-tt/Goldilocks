import { getBackend } from '../config'
import { CloudArticlesStore } from './cloud'

export type ArticleStatus = 'draft' | 'published'

export type Article = {
  id: string
  slug: string
  title: string
  tags: string[]
  heroUrl?: string
  heroDataUrl?: string
  excerpt: string
  body: string
  status: ArticleStatus
  createdAt: number
  updatedAt: number
  metaTitle?: string
  metaDescription?: string
  keyphrase?: string
  canonicalUrl?: string
  noindex?: boolean
}

const STORAGE_KEY = 'gl_articles'

function readAll(): Article[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr
  } catch {
    return []
  }
}

function writeAll(list: Article[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
    try { window.dispatchEvent(new CustomEvent('gl:articles-updated')) } catch {}
  } catch (e) {
    throw e instanceof Error ? e : new Error('STORAGE_WRITE_FAILED')
  }
}

function newId() { return 'a_' + Math.random().toString(36).slice(2, 10) }

const LocalArticlesStore = {
  all(): Article[] { return readAll() },
  published(): Article[] { return readAll().filter(a => a.status === 'published') },
  getBySlug(slug: string): Article | undefined { return readAll().find(a => a.slug === slug) },
  save(input: Partial<Article> & { title: string, slug?: string }): Article {
    const list = readAll()
    const id = input.id || newId()
    const existing = list.find(a => a.id === id)
    const now = Date.now()
    let slug = (input.slug || slugify(input.title))
    slug = ensureUniqueSlug(slug, list, existing?.id)
    let next: Article = {
      id,
      slug,
      title: input.title,
      tags: input.tags || [],
      heroUrl: input.heroUrl,
      heroDataUrl: input.heroDataUrl,
      excerpt: input.excerpt || '',
      body: input.body || '',
      status: (input.status as ArticleStatus) || 'draft',
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      metaTitle: (input as any).metaTitle,
      metaDescription: (input as any).metaDescription,
      keyphrase: (input as any).keyphrase,
      canonicalUrl: (input as any).canonicalUrl,
      noindex: (input as any).noindex,
    }
    const applyIntoList = () => {
      if (existing) {
        const idx = list.findIndex(a => a.id === id)
        list[idx] = { ...existing, ...next }
      } else {
        list.unshift(next)
      }
    }
    try {
      applyIntoList()
      writeAll(list)
      // Push to Supabase in background if enabled
      if (getBackend() === 'supabase') {
        CloudArticlesStore.save(next)
          .then(() => { try { window.dispatchEvent(new CustomEvent('gl:articles-updated')) } catch {} })
          .catch((err) => { try { console.error('Supabase save failed:', err) } catch {} })
      }
      return next
    } catch (err) {
      // Fallback: remove inline image to reduce storage footprint and retry once
      try {
        next = { ...next, heroDataUrl: undefined }
        // re-apply into list (in case pointer changed)
        const idx = list.findIndex(a => a.id === id)
        if (idx >= 0) list[idx] = next; else list.unshift(next)
        writeAll(list)
        if (getBackend() === 'supabase') { CloudArticlesStore.save(next).catch(() => {}) }
        return next
      } catch (err2) {
        throw err2 instanceof Error ? err2 : new Error('STORAGE_WRITE_FAILED')
      }
    }
  },
  delete(id: string) {
    const list = readAll()
    const next = list.filter(a => a.id !== id)
    writeAll(next)
    if (getBackend() === 'supabase') { CloudArticlesStore.delete(id).catch(() => {}) }
  }
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'post'
}

function ensureUniqueSlug(base: string, list: Article[], ignoreId?: string) {
  let slug = base
  let i = 1
  while (list.some(a => a.slug === slug && a.id !== ignoreId)) {
    i++
    slug = base + '-' + i
  }
  return slug
}

// Hydrate local cache from Supabase on startup in supabase mode
if (getBackend() === 'supabase') {
  CloudArticlesStore.all().then((remote) => {
    if (!Array.isArray(remote)) return
    const local = readAll()
    if (local.length === 0) { writeAll(remote as Article[]); return }
    // Merge by id, prefer the newer updatedAt
    const map = new Map<string, Article>()
    for (const r of remote as Article[]) map.set(r.id, r)
    const merged: Article[] = []
    const seen = new Set<string>()
    for (const l of local) {
      const r = map.get(l.id)
      if (r) {
        merged.push((r.updatedAt >= l.updatedAt) ? r : l)
        seen.add(l.id)
      } else {
        merged.push(l)
      }
    }
    for (const r of remote as Article[]) { if (!seen.has(r.id)) merged.push(r) }
    merged.sort((a,b) => b.updatedAt - a.updatedAt)
    writeAll(merged)
  }).catch(() => {})
}

export const ArticlesStore = LocalArticlesStore
