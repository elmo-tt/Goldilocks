import { supabase } from '../cloud/supabaseClient'

export type ArticleStatus = 'draft' | 'published'
export type Article = {
  id: string
  slug: string
  title: string
  tags: string[]
  category?: string
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
  featured?: boolean
  title_es?: string
  excerpt_es?: string
  body_es?: string
  metaTitle_es?: string
  metaDescription_es?: string
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'post'
}

async function ensureUniqueSlug(base: string, ignoreId?: string) {
  if (!supabase) return base
  const likePattern = `${base}%`
  const { data, error } = await supabase
    .from('articles')
    .select('id, slug')
    .like('slug', likePattern)
  if (error || !data) return base
  const others = (data as Array<{ id: string; slug: string }>).filter(r => r.id !== ignoreId)
  const existing = new Set(others.map(r => r.slug))
  let slug = base
  let i = 1
  while (existing.has(slug)) {
    i++
    slug = `${base}-${i}`
  }
  return slug
}

export const CloudArticlesStore = {
  async all(): Promise<Article[]> {
    if (!supabase) return []
    const { data, error } = await supabase.from('articles').select('*')
    if (error) throw error
    const arr = (data || []) as any[]
    arr.sort((a, b) => {
      const au = (typeof a.updatedAt === 'number' ? a.updatedAt : (typeof a.updatedat === 'number' ? a.updatedat : 0))
      const bu = (typeof b.updatedAt === 'number' ? b.updatedAt : (typeof b.updatedat === 'number' ? b.updatedat : 0))
      return bu - au
    })
    return arr as unknown as Article[]
  },
  async published(): Promise<Article[]> {
    if (!supabase) return []
    const { data, error } = await supabase.from('articles').select('*').eq('status', 'published')
    if (error) throw error
    const arr = (data || []) as any[]
    arr.sort((a, b) => {
      const au = (typeof a.updatedAt === 'number' ? a.updatedAt : (typeof a.updatedat === 'number' ? a.updatedat : 0))
      const bu = (typeof b.updatedAt === 'number' ? b.updatedAt : (typeof b.updatedat === 'number' ? b.updatedat : 0))
      return bu - au
    })
    return arr as unknown as Article[]
  },
  async getBySlug(slug: string): Promise<Article | undefined> {
    if (!supabase) return undefined
    const { data, error } = await supabase.from('articles').select('*').eq('slug', slug).limit(1).maybeSingle()
    if (error) return undefined
    return data as unknown as Article | undefined
  },
  async save(input: Partial<Article> & { title: string; slug?: string }): Promise<Article> {
    if (!supabase) throw new Error('Supabase not configured')
    const id = input.id || ('a_' + Math.random().toString(36).slice(2, 10))
    const now = Date.now()
    // If updating (id exists), fetch current to merge and avoid wiping fields
    let existing: Article | undefined
    if (input.id) {
      const cur = await supabase.from('articles').select('*').eq('id', id).limit(1).maybeSingle()
      if (!cur.error) existing = cur.data as unknown as Article | undefined
    }
    const prev = existing || ({} as Partial<Article>)
    // Preserve slug unless explicitly changed or title provided requiring re-slug
    const desiredSlugBase = input.slug || (input.title && input.title !== prev.title ? slugify(input.title) : (prev.slug || slugify(input.title)))
    const uniqueSlug = await ensureUniqueSlug(desiredSlugBase!, input.id)
    const next: Article = {
      id,
      slug: uniqueSlug || (prev.slug as string) || slugify(input.title),
      title: input.title || (prev.title as string) || 'Untitled',
      tags: (input.tags !== undefined ? input.tags : prev.tags) || [],
      category: (input as any).category !== undefined ? (input as any).category : (prev as any)?.category,
      heroUrl: (input.heroUrl !== undefined ? input.heroUrl : prev.heroUrl),
      heroDataUrl: (input.heroDataUrl !== undefined ? input.heroDataUrl : prev.heroDataUrl),
      excerpt: (input.excerpt !== undefined ? input.excerpt : prev.excerpt) || '',
      body: (input.body !== undefined ? input.body : prev.body) || '',
      status: (input.status !== undefined ? input.status : prev.status) || 'draft',
      createdAt: (prev.createdAt as number) || (input as any).createdAt || now,
      updatedAt: now,
      metaTitle: (input as any).metaTitle !== undefined ? (input as any).metaTitle : (prev as any).metaTitle,
      metaDescription: (input as any).metaDescription !== undefined ? (input as any).metaDescription : (prev as any).metaDescription,
      keyphrase: (input as any).keyphrase !== undefined ? (input as any).keyphrase : (prev as any).keyphrase,
      canonicalUrl: (input as any).canonicalUrl !== undefined ? (input as any).canonicalUrl : (prev as any).canonicalUrl,
      noindex: (input as any).noindex !== undefined ? (input as any).noindex : (prev as any).noindex,
      featured: (input as any).featured !== undefined ? (input as any).featured : (prev as any)?.featured,
      title_es: (input as any).title_es !== undefined ? (input as any).title_es : (prev as any)?.title_es,
      excerpt_es: (input as any).excerpt_es !== undefined ? (input as any).excerpt_es : (prev as any)?.excerpt_es,
      body_es: (input as any).body_es !== undefined ? (input as any).body_es : (prev as any)?.body_es,
      metaTitle_es: (input as any).metaTitle_es !== undefined ? (input as any).metaTitle_es : (prev as any)?.metaTitle_es,
      metaDescription_es: (input as any).metaDescription_es !== undefined ? (input as any).metaDescription_es : (prev as any)?.metaDescription_es,
    }
    let { data, error } = await supabase.from('articles').upsert(next as any, { onConflict: 'id' }).select().limit(1)
    if (error) {
      const stripped: any = { ...(next as any) }
      delete stripped.metaTitle_es
      delete stripped.metaDescription_es
      const tryStrip = await supabase.from('articles').upsert(stripped as any, { onConflict: 'id' }).select().limit(1)
      if (!tryStrip.error) {
        data = tryStrip.data as any
      } else {
        const minimal = {
          id: next.id,
          slug: next.slug,
          title: next.title,
          tags: next.tags,
          heroUrl: next.heroUrl,
          heroDataUrl: next.heroDataUrl,
          excerpt: next.excerpt,
          body: next.body,
          status: next.status,
          createdAt: next.createdAt,
          updatedAt: next.updatedAt,
          metaTitle: (next as any).metaTitle,
          metaDescription: (next as any).metaDescription,
          keyphrase: (next as any).keyphrase,
          canonicalUrl: (next as any).canonicalUrl,
          noindex: (next as any).noindex,
          title_es: (next as any).title_es,
          excerpt_es: (next as any).excerpt_es,
          body_es: (next as any).body_es,
        }
        const res = await supabase.from('articles').upsert(minimal as any, { onConflict: 'id' }).select().limit(1)
        if (res.error) throw res.error
        data = res.data as any
      }
    }
    return (data?.[0] || next) as Article
  },
  async delete(id: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) throw error
  },
}
