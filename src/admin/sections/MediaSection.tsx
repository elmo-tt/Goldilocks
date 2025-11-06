import { useEffect, useMemo, useState } from 'react'
import type React from 'react'
import { AssetStore, type AssetMeta } from '@/shared/assets/store'

export default function MediaSection() {
  const [items, setItems] = useState<AssetMeta[]>([])
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  // Off-canvas state for media details
  const [selected, setSelected] = useState<AssetMeta | null>(null)
  const [altText, setAltText] = useState('')
  const [titleText, setTitleText] = useState('')
  const [captionText, setCaptionText] = useState('')
  const [descText, setDescText] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)

  const reload = async () => {
    const list = await AssetStore.list()
    setItems(list)
  }

  useEffect(() => { reload() }, [])

  useEffect(() => {
    let ok = false
    const check = async () => {
      try {
        if (navigator.storage && navigator.storage.persisted) {
          ok = await navigator.storage.persisted()
          setPersisted(ok)
        }
      } catch { setPersisted(false) }
    }
    check()
    return () => { if (ok) return }
  }, [])

  const usageBytes = useMemo(() => items.reduce((n, a) => n + (a.size || 0), 0), [items])
  const usage = useMemo(() => formatBytes(usageBytes), [usageBytes])

  const enablePersistence = async () => {
    try {
      if (navigator.storage && navigator.storage.persist) {
        const ok = await navigator.storage.persist()
        setPersisted(ok)
        alert(ok ? 'Persistent storage enabled for this site.' : 'Could not enable persistent storage in this browser.')
      }
    } catch {}
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return
    setBusy(true)
    for (const f of Array.from(files)) {
      try { await AssetStore.put(f) } catch {}
    }
    await reload()
    setBusy(false)
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this media item?')) return
    await AssetStore.remove(id)
    await reload()
  }

  const copyLink = async (id: string) => {
    const token = `asset:${id}`
    try { await navigator.clipboard.writeText(token); alert('Copied to clipboard: ' + token) } catch { alert(token) }
  }

  // Initialize details drawer fields when a media item is selected
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!selected) return
      // Load existing metadata if present
      try {
        const meta = await (AssetStore as any).getMeta?.(selected.id)
        setAltText(meta?.alt || '')
        setTitleText(meta?.title || selected.name || '')
        setCaptionText(meta?.caption || '')
        setDescText(meta?.description || '')
      } catch {
        setAltText('')
        setTitleText(selected.name || '')
        setCaptionText('')
        setDescText('')
      }
      setCopied(false)
      let u = ''
      try { u = (await AssetStore.getUrl(selected.id)) || '' } catch {}
      if (!cancelled) setFileUrl(u)
    }
    init()
    return () => { cancelled = true }
  }, [selected?.id])

  return (
    <div className="section">
      <div className="card ops-media-head" style={{ marginBottom: 12 }}>
        <div className="ops-media-info">
          <strong>Media Library</strong>
          <span className="ops-sub"> Store and manage images locally (IndexedDB)</span>
          <div className="ops-media-usage" style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Usage: {usage} {persisted === true ? '• Persistent' : persisted === false ? '• Volatile' : ''}</div>
        </div>
        <div className="ops-media-actions">
          <label className="ops-btn" style={{ cursor: 'pointer' }}>
            Upload
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => handleUpload(e.target.files)} />
          </label>
          <button className="ops-btn" onClick={enablePersistence}>Enable Persistence</button>
        </div>
      </div>

      <div className="card">
        <h3>Library</h3>
        {busy && <div style={{ color: 'var(--ops-muted)' }}>Uploading…</div>}
        {items.length === 0 && <div style={{ color: 'var(--ops-muted)' }}>No media yet. Upload images to get started.</div>}
        <div className="ops-media-grid">
          {items.map(meta => (
            <div key={meta.id} onClick={() => setSelected(meta)}>
              <MediaItem
                meta={meta}
                onCopy={(e) => { e.stopPropagation(); copyLink(meta.id) }}
                onRemove={(e) => { e.stopPropagation(); remove(meta.id) }}
              />
            </div>
          ))}
        </div>
      </div>
      {selected && (
        <>
          <div className="ops-media-overlay" onClick={() => setSelected(null)} />
          <div className="ops-media-drawer">
            <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ops-border)' }}>
              <strong>Details</strong>
            </div>
            <div style={{ padding: 12, display: 'grid', gap: 10, overflowY: 'auto' }}>
              <MediaDetailsPreview id={selected.id} name={selected.name} />
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Alt Text</span>
                <input className="input" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Describe the image" />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>File name / Title</span>
                <input className="input" value={titleText} onChange={(e) => setTitleText(e.target.value)} placeholder="Title" />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Caption</span>
                <input className="input" value={captionText} onChange={(e) => setCaptionText(e.target.value)} placeholder="Shown below the image" />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Description</span>
                <textarea value={descText} onChange={(e) => setDescText(e.target.value)} placeholder="Optional description" />
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>File URL</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input className="input" value={fileUrl} onChange={() => {}} readOnly placeholder="https://..." />
                  <button
                    aria-label={copied ? 'Copied' : 'Copy URL'}
                    title={copied ? 'Copied' : 'Copy URL'}
                    onClick={async () => { try { await navigator.clipboard.writeText(fileUrl || ''); setCopied(true); setTimeout(()=>setCopied(false), 1000) } catch {} }}
                    disabled={!fileUrl}
                    style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--ops-border)', background: 'var(--ops-blue-2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ops-text)' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                </div>
                {!!fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Open</a>}
              </div>
            </div>
            <div style={{ padding: 12, borderTop: '1px solid var(--ops-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div>
                <button className="button" onClick={() => setSelected(null)}>Close</button>
              </div>
              <div>
                <button className="button" onClick={async () => {
                  if (!selected) return
                  try {
                    setSavingMeta(true)
                    const patch: any = {
                      alt: altText.trim() || undefined,
                      title: titleText.trim() || undefined,
                      name: titleText.trim() || undefined,
                      caption: captionText.trim() || undefined,
                      description: descText.trim() || undefined,
                    }
                    await (AssetStore as any).updateMeta?.(selected.id, patch)
                    setItems(prev => prev.map(x => x.id === selected.id ? { ...x, name: patch.name || x.name } : x))
                  } finally { setSavingMeta(false) }
                }}>{savingMeta ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MediaItem({ meta, onCopy, onRemove }: { meta: AssetMeta; onCopy: (e: React.MouseEvent) => void; onRemove: (e: React.MouseEvent) => void }) {
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    let mounted = true
    AssetStore.getUrl(meta.id).then(u => { if (mounted) setUrl(u) })
    return () => { mounted = false; AssetStore.revokeUrl(meta.id) }
  }, [meta.id])

  return (
    <div className="panel" style={{ padding: 10, display: 'grid', gap: 8 }}>
      <div style={{ aspectRatio: '4 / 3', background: 'var(--ops-blue-2)', borderRadius: 8, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
        {url ? (
          <img src={url} alt={meta.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Preview</div>
        )}
      </div>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{meta.name}</div>
        <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{formatBytes(meta.size)} • {new Date(meta.createdAt).toLocaleString()}</div>
      </div>
      <div className="actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="button" onClick={onCopy}>Copy Link</button>
        <button className="button" onClick={onRemove}>Delete</button>
      </div>
    </div>
  )
}

// Separate preview for details drawer to avoid reusing tile preview state
function MediaDetailsPreview({ id, name }: { id: string, name: string }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let mounted = true
    AssetStore.getUrl(id).then(u => { if (mounted && u) setUrl(u) })
    return () => { mounted = false }
  }, [id])
  return (
    <div style={{ width: '100%', aspectRatio: '4 / 3', background: 'var(--ops-blue-2)', borderRadius: 8, overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
      {url ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} /> : <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Preview</div>}
    </div>
  )
}

function formatBytes(n: number) {
  if (!n) return '0 B'
  const u = ['B','KB','MB','GB']
  let i = 0; let v = n
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${u[i]}`
}
