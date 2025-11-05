import { getBackend } from '../config'
import { CloudAssetStore } from './cloud'

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

const DB_NAME = 'gl_assets'
const DB_VERSION = 1
const META_STORE = 'assets_meta'
const BLOB_STORE = 'assets_blob'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T = unknown>(db: IDBDatabase, mode: IDBTransactionMode, stores: string[], op: (t: IDBTransaction) => void, ondone: (res?: T) => void, onerr: (e: any) => void) {
  const t = db.transaction(stores, mode)
  t.oncomplete = () => ondone()
  t.onerror = () => onerr(t.error)
  op(t)
}

function newId() { return 'm_' + Math.random().toString(36).slice(2, 10) }

const LocalAssetStore = {
  async put(file: Blob & { name?: string, type?: string }): Promise<AssetMeta> {
    const db = await openDB()
    const id = newId()
    const meta: AssetMeta = {
      id,
      name: (file as any).name || 'image',
      type: (file as any).type || 'application/octet-stream',
      size: file.size,
      createdAt: Date.now(),
    }
    return await new Promise<AssetMeta>((resolve, reject) => {
      tx<AssetMeta>(db, 'readwrite', [META_STORE, BLOB_STORE], (t) => {
        t.objectStore(META_STORE).put(meta)
        t.objectStore(BLOB_STORE).put(file, id)
      }, () => resolve(meta), reject)
    })
  },

  async getMeta(id: string): Promise<AssetMeta | undefined> {
    const db = await openDB()
    return await new Promise<AssetMeta | undefined>((resolve, reject) => {
      const t = db.transaction([META_STORE], 'readonly')
      const req = t.objectStore(META_STORE).get(id)
      req.onsuccess = () => resolve(req.result as AssetMeta | undefined)
      req.onerror = () => reject(req.error)
    })
  },

  async list(): Promise<AssetMeta[]> {
    const db = await openDB()
    return await new Promise<AssetMeta[]>((resolve, reject) => {
      const metas: AssetMeta[] = []
      const t = db.transaction([META_STORE], 'readonly')
      const store = t.objectStore(META_STORE)
      const req = store.openCursor(null, 'prev')
      req.onsuccess = () => {
        const cur = req.result
        if (cur) {
          metas.push(cur.value as AssetMeta)
          cur.continue()
        } else {
          resolve(metas)
        }
      }
      req.onerror = () => reject(req.error)
    })
  },

  async getBlob(id: string): Promise<Blob | undefined> {
    const db = await openDB()
    return await new Promise<Blob | undefined>((resolve, reject) => {
      const t = db.transaction([BLOB_STORE], 'readonly')
      const req = t.objectStore(BLOB_STORE).get(id)
      req.onsuccess = () => resolve(req.result as Blob | undefined)
      req.onerror = () => reject(req.error)
    })
  },

  async remove(id: string): Promise<void> {
    const db = await openDB()
    return await new Promise<void>((resolve, reject) => {
      tx<void>(db, 'readwrite', [META_STORE, BLOB_STORE], (t) => {
        t.objectStore(META_STORE).delete(id)
        t.objectStore(BLOB_STORE).delete(id)
      }, () => resolve(), reject)
    })
  },

  async updateMeta(id: string, patch: Partial<AssetMeta>): Promise<void> {
    const db = await openDB()
    return await new Promise<void>((resolve, reject) => {
      const t = db.transaction([META_STORE], 'readwrite')
      const store = t.objectStore(META_STORE)
      const req = store.get(id)
      req.onsuccess = () => {
        const cur = (req.result as AssetMeta | undefined)
        if (!cur) {
          // create minimal record if missing
          const next: AssetMeta = { id, name: patch.title || patch.alt || 'asset', type: 'application/octet-stream', size: 0, createdAt: Date.now(), ...patch }
          store.put(next as any)
        } else {
          const next = { ...cur, ...patch }
          store.put(next as any)
        }
      }
      t.oncomplete = () => resolve()
      t.onerror = () => reject(t.error)
    })
  },

  _urlCache: new Map<string, string>(),

  async getUrl(id: string): Promise<string | undefined> {
    if (this._urlCache.has(id)) return this._urlCache.get(id)
    const blob = await this.getBlob(id)
    if (!blob) return undefined
    const url = URL.createObjectURL(blob)
    this._urlCache.set(id, url)
    return url
  },

  async getThumbUrl(id: string, _width = 320): Promise<string | undefined> {
    // Local backend has no server-side transforms; return full blob URL.
    return await this.getUrl(id)
  },

  revokeUrl(id: string) {
    const url = this._urlCache.get(id)
    if (url) URL.revokeObjectURL(url)
    this._urlCache.delete(id)
  },
}

export const AssetStore = getBackend() === 'supabase' ? CloudAssetStore : LocalAssetStore
