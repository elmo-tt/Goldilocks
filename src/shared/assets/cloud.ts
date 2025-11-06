import { supabase } from '../cloud/supabaseClient'
import { getSupabaseEnv } from '../config'

export type AssetMeta = {
  id: string
  name: string
  type: string
  size: number
  createdAt: number
  // Optional user metadata
  title?: string
  alt?: string
  caption?: string
  description?: string
}

const { bucket } = getSupabaseEnv()

function newId() { return 'm_' + Math.random().toString(36).slice(2, 10) }

export const CloudAssetStore = {
  _urlCache: new Map<string, string>(),
  _thumbCache: new Map<string, string>(),
  // Probe if the optional 'assets' table exists/works; cache the result to avoid noisy errors.
  _tableReady: null as null | boolean,
  async _ensureTable() {
    if (!supabase) { this._tableReady = false; return false }
    if (this._tableReady != null) return this._tableReady
    try {
      // Opt-in via env flag. By default, avoid using the assets table entirely.
      const flag = (() => {
        try { return String((import.meta as any).env?.VITE_ASSETS_TABLE_ENABLED || '') } catch { return '' }
      })().toLowerCase()
      const enabled = ['1','true','yes','on'].includes(flag)
      if (!enabled) { this._tableReady = false; return false }
      // Probe required columns explicitly to avoid 400s on schema mismatch.
      const { error } = await (supabase.from('assets') as any).select('id,name').limit(1)
      this._tableReady = !error
    } catch { this._tableReady = false }
    return this._tableReady
  },
  // Local fallback for metadata when Supabase table/columns aren't available
  async _openMetaDB(): Promise<IDBDatabase> {
    return await new Promise((resolve, reject) => {
      const req = indexedDB.open('gl_assets_meta', 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains('extra_meta')) db.createObjectStore('extra_meta', { keyPath: 'id' })
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },
  async _getLocalMeta(id: string): Promise<AssetMeta | undefined> {
    try {
      const db = await this._openMetaDB()
      return await new Promise<AssetMeta | undefined>((resolve, reject) => {
        const t = db.transaction(['extra_meta'], 'readonly')
        const req = t.objectStore('extra_meta').get(id)
        req.onsuccess = () => resolve(req.result as AssetMeta | undefined)
        req.onerror = () => reject(req.error)
      })
    } catch { return undefined }
  },
  async _updateLocalMeta(id: string, patch: Partial<AssetMeta>): Promise<void> {
    try {
      const db = await this._openMetaDB()
      await new Promise<void>((resolve, reject) => {
        const t = db.transaction(['extra_meta'], 'readwrite')
        const store = t.objectStore('extra_meta')
        const getReq = store.get(id)
        getReq.onsuccess = () => {
          const cur = getReq.result as AssetMeta | undefined
          const next = cur ? { ...cur, ...patch } : ({ id, name: patch.title || patch.alt || 'asset', type: 'application/octet-stream', size: 0, createdAt: Date.now(), ...patch } as any)
          store.put(next)
        }
        t.oncomplete = () => resolve()
        t.onerror = () => reject(t.error)
      })
    } catch {}
  },

  async put(file: Blob & { name?: string, type?: string }): Promise<AssetMeta> {
    if (!supabase) throw new Error('Supabase not configured')
    const id = newId()
    const path = id
    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: (file as any).type })
    if (upErr) throw upErr
    const meta: AssetMeta = {
      id,
      name: (file as any).name || 'file',
      type: (file as any).type || 'application/octet-stream',
      size: file.size,
      createdAt: Date.now(),
    }
    // Best-effort: store minimal metadata in optional table 'assets'.
    // To avoid 400 on schema mismatch, only write { id, name }.
    try {
      if (await this._ensureTable()) {
        await supabase.from('assets').insert({ id, name: meta.name } as any)
      }
    } catch {}
    return meta
  },

  async getMeta(id: string): Promise<AssetMeta | undefined> {
    if (!supabase) return undefined
    try {
      if (!(await this._ensureTable())) throw new Error('TABLE_DISABLED')
      const { data, error } = await (supabase.from('assets') as any).select('*').eq('id', id).maybeSingle()
      if (!error && data) {
        const base = data as unknown as AssetMeta
        // If optional fields are missing, try to fill from local fallback
        if (!base.alt && !base.title && !base.caption && !base.description) {
          const local = await this._getLocalMeta(id)
          return { ...base, ...local }
        }
        // Or always merge, preferring Supabase values
        const local = await this._getLocalMeta(id)
        return local ? { ...local, ...base } : base
      }
    } catch {}
    // Fallback to local cached metadata
    return await this._getLocalMeta(id)
  },

  async getThumbUrl(id: string, width = 320): Promise<string | undefined> {
    const key = `${id}@w${width}`
    if (this._thumbCache.has(key)) return this._thumbCache.get(key)
    if (!supabase) return undefined
    try {
      // Prefer public URL with transform if bucket is public
      const pub = (supabase.storage.from(bucket).getPublicUrl(id, { transform: { width, quality: 75 } }) as any)
      const url = pub?.data?.publicUrl as string | undefined
      if (url) {
        this._thumbCache.set(key, url)
        return url
      }
    } catch {}
    try {
      // Fallback to signed URL with transform
      const { data, error } = await (supabase.storage.from(bucket) as any).createSignedUrl(id, 3600, { transform: { width, quality: 75 } })
      if (!error && data?.signedUrl) {
        this._thumbCache.set(key, data.signedUrl)
        return data.signedUrl
      }
    } catch {}
    // Last resort: full URL
    return await this.getUrl(id)
  },

  async list(): Promise<AssetMeta[]> {
    if (!supabase) return []
    // Prefer listing directly from Storage to avoid requiring an assets table.
    try {
      const { data, error } = await (supabase as any).storage.from(bucket).list('', { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } })
      if (!error && Array.isArray(data)) {
        // Map Storage FileObject to AssetMeta
        return (data as any[]).filter(o => !o.name?.endsWith('/')).map(o => ({
          id: o.name,
          name: o.name,
          type: (o.metadata && o.metadata.mimetype) || 'application/octet-stream',
          size: (o.metadata && (o.metadata.size || o.metadata.contentLength)) || 0,
          createdAt: o.created_at ? Date.parse(o.created_at) : Date.now(),
        }))
      }
    } catch {}
    // Fallback to table if available
    try {
      if (await this._ensureTable()) {
        const { data, error } = await supabase.from('assets').select('*').order('createdAt', { ascending: false })
        if (!error && data) return (data as unknown as AssetMeta[])
      }
    } catch {}
    return []
  },

  async getBlob(id: string): Promise<Blob | undefined> {
    if (!supabase) return undefined
    const { data, error } = await supabase.storage.from(bucket).download(id)
    if (error) return undefined
    return data as Blob
  },

  async getUrl(id: string): Promise<string | undefined> {
    if (this._urlCache.has(id)) return this._urlCache.get(id)
    if (!supabase) return undefined
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(id, 3600)
      if (!error && data?.signedUrl) {
        this._urlCache.set(id, data.signedUrl)
        return data.signedUrl
      }
    } catch (e) {
      console.warn('createSignedUrl failed', e)
    }
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(id)
      const url = (data as any)?.publicUrl as string | undefined
      if (url) {
        this._urlCache.set(id, url)
        return url
      }
    } catch (e) {
      console.warn('getPublicUrl failed', e)
    }
    return undefined
  },

  revokeUrl(id: string) {
    this._urlCache.delete(id)
  },

  async exists(id: string): Promise<boolean> {
    if (!supabase) return false
    try {
      const { data, error } = await (supabase.storage.from(bucket) as any).createSignedUrl(id, 1)
      return !error && !!data?.signedUrl
    } catch { return false }
  },

  async ensureBlob(id: string, blob: Blob & { type?: string }): Promise<void> {
    if (!supabase) return
    const present = await this.exists(id)
    if (present) return
    await supabase.storage.from(bucket).upload(id, blob, { upsert: false, contentType: (blob as any).type || 'application/octet-stream' })
  },

  async remove(id: string): Promise<void> {
    if (!supabase) return
    await supabase.storage.from(bucket).remove([id])
    try { if (await this._ensureTable()) await supabase.from('assets').delete().eq('id', id) } catch {}
    this.revokeUrl(id)
  },
  async updateMeta(id: string, patch: Partial<AssetMeta>): Promise<void> {
    if (!supabase) return
    // Prefer writing full metadata if the table supports these columns; fallback to name-only.
    const newName = (patch.name || patch.title)?.trim?.()
    try {
      if (await this._ensureTable()) {
        const full: any = {}
        if (newName) full.name = newName
        if (patch.title != null) full.title = patch.title
        if (patch.alt != null) full.alt = patch.alt
        if (patch.caption != null) full.caption = patch.caption
        if (patch.description != null) full.description = patch.description
        let didFull = false
        if (Object.keys(full).length) {
          const upd: any = await (supabase.from('assets') as any).update(full).eq('id', id).select().limit(1)
          if (upd?.error) throw new Error('FULL_UPDATE_FAILED')
          const noRow = !upd?.data || (Array.isArray(upd.data) && upd.data.length === 0)
          if (noRow) {
            const insertRec: any = { id, ...full }
            const ins: any = await (supabase.from('assets') as any).insert(insertRec)
            if (ins?.error) throw new Error('FULL_INSERT_FAILED')
          }
          didFull = true
        }
        if (!didFull && newName) {
          // Fallback to name-only path
          const minimal: any = { name: newName }
          const upd2: any = await (supabase.from('assets') as any).update(minimal).eq('id', id).select().limit(1)
          const noRow2 = !!upd2?.error || !upd2?.data || (Array.isArray(upd2.data) && upd2.data.length === 0)
          if (noRow2) {
            await (supabase.from('assets') as any).insert({ id, name: newName } as any)
          }
        }
      }
    } catch {}
    // Always write to local fallback so UI can reflect changes even if table/columns are absent
    await this._updateLocalMeta(id, patch)
  },
}
