import { supabase } from '../cloud/supabaseClient'

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
    let baseSlug = (input.slug || slugify(input.title))
    const uniqueSlug = await ensureUniqueSlug(baseSlug, input.id)
    const next: Article = {
      id,
      slug: uniqueSlug,
      title: input.title,
      tags: input.tags || [],
      heroUrl: input.heroUrl,
      heroDataUrl: input.heroDataUrl,
      excerpt: input.excerpt || '',
      body: input.body || '',
      status: (input.status as ArticleStatus) || 'draft',
      createdAt: (input as any).createdAt || now,
      updatedAt: now,
      metaTitle: (input as any).metaTitle,
      metaDescription: (input as any).metaDescription,
      keyphrase: (input as any).keyphrase,
      canonicalUrl: (input as any).canonicalUrl,
      noindex: (input as any).noindex,
    }
    let { data, error } = await supabase.from('articles').upsert(next, { onConflict: 'id' }).select().limit(1)
    if (error) {
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
      }
      const res = await supabase.from('articles').upsert(minimal as any, { onConflict: 'id' }).select().limit(1)
      if (res.error) throw res.error
      data = res.data as any
    }
    return (data?.[0] || next) as Article
  },
  async delete(id: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) throw error
  },
}
