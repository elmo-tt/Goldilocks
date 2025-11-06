import { useEffect, useRef, useState, type RefObject } from 'react'
import { bus } from '../utils/bus'
import { PRACTICE_AREAS } from '../data/goldlaw'
import { ArticlesStore, type Article, slugify } from '../../shared/articles/store'
import { AssetStore, type AssetMeta } from '../../shared/assets/store'
import { getBackend } from '../../shared/config'
import RichTextEditor from '../components/RichTextEditor'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{label}</span>
      {children}
    </div>
  )
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

async function inlineAssetsInBody(body: string): Promise<string> {
  if (!body) return body
  // HTML mode: <img src="asset:ID"> -> <img src="data:...">
  if (looksLikeHtml(body)) {
    const container = document.createElement('div')
    container.innerHTML = body
    const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
    for (const img of imgs) {
      const src = img.getAttribute('src') || ''
      if (src.startsWith('asset:')) {
        const id = src.slice(6)
        try {
          const blob = await AssetStore.getBlob(id)
          if (blob) {
            const dataUrl = await blobToDataUrl(blob)
            const compressed = await compressDataUrl(dataUrl, 1600, 0.82)
            img.setAttribute('src', compressed)
            img.removeAttribute('data-asset-id')
          }
        } catch {}
      }
    }
    return container.innerHTML
  }
  // Markdown mode: ![alt](asset:ID "title") -> ![alt](data:... "title")
  let out = body
  const mdImgRe = /!\[([^\]]*)\]\((asset:[^\s\)]+)(?:\s+"([^"]*)")?\)/g
  const matches = Array.from(body.matchAll(mdImgRe))
  for (const m of matches) {
    const full = m[0]
    const alt = m[1]
    const token = m[2]
    const title = (m[3] || '').trim()
    const id = token.replace(/^asset:/, '')
    try {
      const blob = await AssetStore.getBlob(id)
      if (blob) {
        const dataUrl = await blobToDataUrl(blob)
        const compressed = await compressDataUrl(dataUrl, 1600, 0.82)
        const replacement = title ? `![${alt}](${compressed} "${title}")` : `![${alt}](${compressed})`
        out = out.replace(full, replacement)
      }
    } catch {}
  }
  return out
}


function StatusBadge({ status }: { status: Article['status'] }) {
  const s = status === 'published'
    ? { bg: 'rgba(34,197,94,0.18)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)' }
    : { bg: 'rgba(234,179,8,0.18)', color: '#eab308', border: '1px solid rgba(234,179,8,0.35)' }
  return <span style={{ background: s.bg, color: s.color, border: s.border, padding: '4px 8px', borderRadius: 999, fontSize: 12 }}>{status}</span>
}

function ListView({ onCreate, onEdit }: { onCreate: () => void; onEdit: (id: string) => void }) {
  const [items, setItems] = useState<Article[]>([])
  const reload = () => setItems(ArticlesStore.all())
  useEffect(reload, [])

  return (
    <div className="section">
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, marginBottom: 12 }}>
        <div>
          <strong>Articles</strong>
          <span className="ops-sub"> Manage and publish articles for the public site</span>
        </div>
        <button className="ops-btn" onClick={onCreate}>Create Article</button>
      </div>

      <div className="card">
        <h3>All</h3>
        <div style={{ display: 'grid', gap: 8 }}>
          {items.length === 0 && <div style={{ color: 'var(--ops-muted)' }}>No articles yet. Click "Create Article" to start.
          </div>}
          {items.map(a => (
            <div key={a.id} className="ops-list-row">
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>{a.slug} • {new Date(a.updatedAt).toLocaleString()}</div>
              </div>
              <div className="ops-list-status"><StatusBadge status={a.status} /></div>
              <div className="ops-list-actions">
                <button className="button" onClick={() => onEdit(a.id)}>Edit</button>
                {a.status === 'published' && <a className="button" href={`/articles/${a.slug}`} target="_blank" rel="noreferrer">View</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EditorView({ initial, onBack }: { initial?: Article; onBack: () => void }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [slug, setSlug] = useState(initial?.slug || '')
  const [tags, setTags] = useState((initial?.tags || []).join(', '))
  const [heroUrl, setHeroUrl] = useState(initial?.heroUrl || '')
  const [heroDataUrl, setHeroDataUrl] = useState(initial?.heroDataUrl || '')
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '')
  const [body, setBody] = useState(initial?.body || '')
  const [status] = useState<Article['status']>(initial?.status || 'draft')
  const [saving, setSaving] = useState(false)
  const [previewSrc, setPreviewSrc] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerItems, setPickerItems] = useState<AssetMeta[]>([])
  const [pickerFor, setPickerFor] = useState<'hero' | 'body'>('hero')
  const bodyRef = useRef<HTMLTextAreaElement | null>(null)
  const editorApiRef = useRef<{
    insertImage: (token: string) => void
    insertMedia?: (info: { id: string; src?: string; alt?: string; title?: string; caption?: string; description?: string; widthPct?: number }) => void
  } | null>(null)
  const [editorMode, setEditorMode] = useState<'plain' | 'wysiwyg'>('wysiwyg')
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle || '')
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription || '')
  const [keyphrase, setKeyphrase] = useState(initial?.keyphrase || '')
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonicalUrl || '')
  const [noindex, setNoindex] = useState<boolean>(!!initial?.noindex)

  useEffect(() => { if (!slug && title) setSlug(slugify(title)) }, [title, slug])

  useEffect(() => {
    let revokeId: string | null = null
    let cancelled = false
    const run = async () => {
      if (heroDataUrl) { setPreviewSrc(heroDataUrl); return }
      if (heroUrl && heroUrl.startsWith('asset:')) {
        const id = heroUrl.slice(6)
        const url = await AssetStore.getUrl(id)
        if (!cancelled) setPreviewSrc(url || '')
        revokeId = id
      } else {
        setPreviewSrc(heroUrl)
      }
    }
    run()
    return () => { cancelled = true; if (revokeId) AssetStore.revokeUrl(revokeId) }
  }, [heroUrl, heroDataUrl])

  const pickFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      const src = reader.result as string
      const out = await compressDataUrl(src, 1600, 0.82)
      try {
        const blob = await (await fetch(out)).blob()
        const named = new File([blob], file.name || 'image', { type: blob.type || file.type })
        const meta = await AssetStore.put(named)
        setHeroDataUrl('')
        const token = `asset:${meta.id}`
        setHeroUrl(token)
        const url = await AssetStore.getUrl(meta.id)
        if (url) setPreviewSrc(url)
      } catch {
        // fallback to inline if AssetStore fails
        setHeroDataUrl(out)
      }
    }
    reader.readAsDataURL(file)
  }

  const aiDraft = () => {
    const now = new Date().toLocaleDateString()
    if (!excerpt) setExcerpt(`Summary: Legal takeaways and practical steps after recent events (${now}).`)
    if (!body) setBody(`# ${title || 'Untitled'}\n\nIntro — put the headline in context and explain why it matters for Florida injury victims.\n\n1) Facts and what we know\n2) What Florida law says (duty, negligence, damages)\n3) What to do next (evidence, medical, report)\n\nCTA: Call GOLDLAW now or request a free consultation.\n\nDisclaimer: This post is for educational purposes and is not legal advice.`)
  }

  const save = async (nextStatus?: Article['status']) => {
    setSaving(true)
    try {
      // Enforce simple editorial rules (strip Intro/Conclusion headings; ensure CTA)
      const enforcedBody = enforceEditorialRules(body, tags.split(',').map(s => s.trim()).filter(Boolean), title, excerpt)

      // For local backend, inline assets into body so it doesn't depend on local IndexedDB.
      // For Supabase, keep asset: tokens and resolve at render time via signed URLs.
      const processedBody = (getBackend() === 'supabase') ? enforcedBody : await inlineAssetsInBody(enforcedBody)
      const saved = ArticlesStore.save({
        id: initial?.id,
        title: title.trim() || 'Untitled',
        slug: slug.trim() || slugify(title || 'post'),
        tags: tags.split(',').map(s => s.trim()).filter(Boolean),
        heroUrl: heroUrl.trim() || undefined,
        heroDataUrl: heroDataUrl || undefined,
        excerpt,
        body: processedBody,
        status: nextStatus || status,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        keyphrase: keyphrase.trim() || undefined,
        canonicalUrl: canonicalUrl.trim() || undefined,
        noindex,
      })
      if (!saved.heroDataUrl && heroDataUrl && !heroUrl) {
        window.alert('Your uploaded image was too large to store and was not saved. Please use the Image URL field or upload a smaller image.')
      }
      if (!initial?.id) {
        window.alert('Saved. Returning to list…')
      } else {
        window.alert('Saved! Returning to list…')
      }
      onBack()
    } finally {
      setSaving(false)
    }
  }

  const del = () => {
    if (!initial?.id) return onBack()
    if (!confirm('Delete this article?')) return
    ArticlesStore.delete(initial.id)
    onBack()
  }

  const runCtaCleanup = async () => {
    try {
      setSaving(true)
      const all = ArticlesStore.all()
      let changed = 0
      for (const a of all) {
        try {
          const nextBody = enforceEditorialRules(a.body || '', a.tags || [], a.title || '', a.excerpt || '')
          if (nextBody && nextBody !== a.body) {
            ArticlesStore.save({ id: a.id, title: a.title, body: nextBody })
            changed++
          }
        } catch {}
      }
      try { bus.emit('toast', { message: `CTA cleanup: updated ${changed} article(s).`, type: 'success' }) } catch { window.alert(`CTA cleanup: updated ${changed} article(s).`) }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="section marketing-layout">
      <div>
        <div className="card" style={{ minHeight: 280 }}>
          <h3>Editor</h3>
          <div style={{ display: 'grid', gap: 24 }}>
            <Field label="Title">
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Article title" />
            </Field>

            <div className="ops-two-col">
              <Field label="Slug">
                <input className="input" value={slug} onChange={e => setSlug(slugify(e.target.value))} placeholder="auto-from-title" />
              </Field>
              <Field label="Tags (comma-separated)">
                <input className="input" value={tags} onChange={e => setTags(e.target.value)} placeholder="truck, safety, litigation" />
              </Field>
            </div>

            <Field label="Excerpt">
              <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Short summary" />
            </Field>

            <Field label={`Body (${editorMode === 'wysiwyg' ? 'WYSIWYG (HTML)' : 'Markdown or plain text'})`}>
              <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                <button type="button" className={editorMode==='plain'?'btn blue':'button'} onClick={()=>setEditorMode('plain')}>Plain</button>
                <button type="button" className={editorMode==='wysiwyg'?'btn blue':'button'} onClick={()=>setEditorMode('wysiwyg')}>WYSIWYG</button>
              </div>
              {editorMode === 'plain' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                <button type="button" className="button" onClick={() => setBody(applyWrap(body, bodyRef, '**', '**'))}>B</button>
                <button type="button" className="button" onClick={() => setBody(applyWrap(body, bodyRef, '*', '*'))}>I</button>
                <button type="button" className="button" onClick={() => setBody(applyWrap(body, bodyRef, '<u>', '</u>'))}>U</button>
                <button type="button" className="button" onClick={() => setBody(applyWrap(body, bodyRef, '`', '`'))}>Code</button>
                <button type="button" className="button" onClick={() => setBody(applyHeading(body, bodyRef, '## '))}>H2</button>
                <button type="button" className="button" onClick={() => setBody(applyHeading(body, bodyRef, '### '))}>H3</button>
                <button type="button" className="button" onClick={() => setBody(applyLinePrefix(body, bodyRef, '- '))}>• List</button>
                <button type="button" className="button" onClick={() => setBody(applyNumberList(body, bodyRef))}>1. List</button>
                <button type="button" className="button" onClick={() => setBody(applyLinePrefix(body, bodyRef, '> '))}>Quote</button>
                <button type="button" className="button" onClick={async () => {
                  const url = prompt('Link URL', 'https://') || ''
                  if (!url) return
                  setBody(applyLink(body, bodyRef, url))
                }}>Link</button>
                <button type="button" className="button" onClick={() => { setPickerFor('body'); setPickerOpen(true); setPickerItems([]); AssetStore.list().then((list)=>setPickerItems(list)).catch(()=>{}) }}>Add Media</button>
              </div>
              )}
              {editorMode === 'plain' ? (
                <textarea ref={bodyRef} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your article..." />
              ) : (
                <RichTextEditor
                  value={stampAssetIds(looksLikeHtml(body) ? body : plainToHtml(body))}
                  onChange={(html) => setBody(html)}
                  onPickAsset={() => {
                    // Open immediately for responsiveness; load items async.
                    setPickerFor('body');
                    setPickerOpen(true);
                    setPickerItems([]);
                    AssetStore.list().then((list) => setPickerItems(list)).catch(() => {})
                  }}
                  registerApi={(api) => { editorApiRef.current = api }}
                />
              )}
            </Field>
          </div>
        </div>
      </div>

      <div className="right-rail">
        <div className="panel">
          <h4>Hero Image</h4>
          <Field label="Image URL">
            <input className="input" value={heroUrl} onChange={e => setHeroUrl(e.target.value)} placeholder="https://..." />
          </Field>
          <div className="actions" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label className="btn blue">
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f) }} />
                Upload
              </label>
              <button className="btn purple" onClick={async () => { setPickerFor('hero'); setPickerOpen(true); setPickerItems(await AssetStore.list()) }}>Media</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {previewSrc && <a className="btn teal" href={previewSrc} target="_blank" rel="noreferrer">Open</a>}
              <button className="btn red" onClick={() => { setHeroDataUrl(''); setHeroUrl(''); setPreviewSrc('') }} disabled={!(heroDataUrl || heroUrl)}>
                Remove
              </button>
            </div>
          </div>
          {(previewSrc || heroDataUrl || heroUrl) && <img src={previewSrc || heroDataUrl || heroUrl} alt="hero" style={{ width: '100%', marginTop: 8, borderRadius: 8 }} />}
        </div>

        <div className="panel">
          <h4>SEO</h4>
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Focus keyphrase">
              <input className="input" value={keyphrase} onChange={e => setKeyphrase(e.target.value)} placeholder="e.g. Florida truck accident lawyer" />
            </Field>
            <Field label={`Meta title (${(metaTitle || title).length}/65)`}>
              <input className="input" value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Overrides title in SERP" />
            </Field>
            <Field label={`Meta description (${(metaDescription || excerpt).length}/160)`}>
              <textarea value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="Short SERP description" />
            </Field>
            <Field label="Canonical URL">
              <input className="input" value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} placeholder="https://www.example.com/..." />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input id="noindex" type="checkbox" checked={noindex} onChange={e => setNoindex(e.target.checked)} />
              <label htmlFor="noindex">Noindex</label>
            </div>
            <SerpPreview
              title={(metaTitle || title).trim()}
              url={canonicalUrl.trim() || (`/articles/${slug || slugify(title || 'post')}`)}
              description={(metaDescription || excerpt).trim()}
            />
            <SeoChecks
              title={title}
              slug={slug}
              body={body}
              excerpt={excerpt}
              keyphrase={keyphrase}
              metaTitle={metaTitle}
              metaDescription={metaDescription}
            />
          </div>
        </div>

        <div className="panel">
          <h4>AI Helpers (stub)</h4>
          <div className="actions">
            <button className="button" onClick={aiDraft}>Generate Draft</button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ops-muted)', marginTop: 6 }}>This is a placeholder; no external AI calls yet.</div>
        </div>

        <div className="panel">
          <h4>Actions</h4>
          <div className="actions" style={{ flexWrap: 'wrap' }}>
            <button className="button" onClick={() => save('draft')} disabled={saving}>Save Draft</button>
            <button className="button" onClick={() => save('published')} disabled={saving}>Publish</button>
            <button className="button" onClick={onBack}>Back to List</button>
            <button className="btn red" onClick={del}>Delete</button>
            <button className="btn teal" onClick={runCtaCleanup} disabled={saving}>Run CTA Cleanup</button>
          </div>
        </div>
      </div>

      <MediaPicker
        open={pickerOpen}
        items={pickerItems}
        onClose={() => { setPickerOpen(false) }}
        onSelect={async (info) => {
          if (pickerFor === 'hero') {
            const token = `asset:${info.id}`
            setHeroDataUrl('')
            setHeroUrl(token)
            try { await navigator.clipboard.writeText(token) } catch {}
            setPickerOpen(false)
            return
          }
          const id = info.id
          const token = `asset:${id}`
          if (editorMode === 'wysiwyg') {
            setPickerOpen(false)
            let src = info.url || ''
            if (!src) { try { src = (await AssetStore.getUrl(id)) || '' } catch {} }
            if (!src) src = `asset:${id}`
            // If metadata wasn't provided from the details panel, load saved metadata
            let saved: Partial<AssetMeta & { alt?: string; title?: string; caption?: string; description?: string }> | undefined
            if (info.alt == null && info.title == null && info.caption == null && info.description == null) {
              try { saved = await (AssetStore as any).getMeta?.(id) } catch {}
            }
            const payload = {
              id,
              src,
              alt: (info.alt ?? saved?.alt) || '',
              title: (info.title ?? saved?.title) || undefined,
              caption: (info.caption ?? saved?.caption) || undefined,
              description: (info.description ?? saved?.description) || undefined,
              widthPct: 50,
            }
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                editorApiRef.current?.insertMedia?.(payload)
              })
            })
          } else {
            setBody(applyImage(body, bodyRef, token))
            setPickerOpen(false)
          }
        }}
      />
    </div>
  )
}

export default function ArticlesSection() {
  const [mode, setMode] = useState<'list' | 'edit'>('list')
  const [editing, setEditing] = useState<Article | undefined>(undefined)

  const onCreate = () => { setEditing(undefined); setMode('edit') }
  const onEdit = (id: string) => {
    const a = ArticlesStore.all().find(x => x.id === id)
    if (a) { setEditing(a); setMode('edit') }
  }

  if (mode === 'edit') return <EditorView key={editing?.id || 'new'} initial={editing} onBack={() => setMode('list')} />
  return <ListView onCreate={onCreate} onEdit={onEdit} />
}

function MediaPicker({ open, items, onClose, onSelect }: { open: boolean; items: AssetMeta[]; onClose: () => void; onSelect: (info: { id: string; alt?: string; title?: string; caption?: string; description?: string; url?: string }) => void }) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [list, setList] = useState<AssetMeta[]>(items)
  const [uploading, setUploading] = useState(false)
  const [selected, setSelected] = useState<AssetMeta | null>(null)
  const [altText, setAltText] = useState('')
  const [titleText, setTitleText] = useState('')
  const [captionText, setCaptionText] = useState('')
  const [descText, setDescText] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  useEffect(() => { if (open) setList(items) }, [open, items])
  useEffect(() => {
    let mounted = true
    const run = async () => {
      const ent: Record<string, string> = {}
      for (const m of list) {
        const u = await AssetStore.getUrl(m.id)
        if (u) ent[m.id] = u
      }
      if (mounted) setUrls(ent)
    }
    if (open) run()
    return () => { mounted = false }
  }, [open, list])
  useEffect(() => {
    let cancelled = false
    const init = async () => {
      if (!selected) return
      // Load existing metadata if available
      try {
        const meta = await AssetStore.getMeta?.(selected.id)
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
  // Hide Copilot FAB while picker is open
  useEffect(() => {
    try { bus.emit('fab', { hidden: open }) } catch {}
    return () => { try { bus.emit('fab', { hidden: false }) } catch {} }
  }, [open])
  const onFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        setUploading(true)
        const dataUrl = reader.result as string
        const out = await compressDataUrl(dataUrl, 1600, 0.82)
        const blob = await (await fetch(out)).blob()
        const named = new File([blob], file.name || 'image', { type: blob.type || file.type })
        const meta = await AssetStore.put(named)
        setList(prev => [meta, ...prev])
        const u = await AssetStore.getThumbUrl(meta.id, 320)
        if (u) setUrls(prev => ({ ...prev, [meta.id]: u }))
      } finally {
        setUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }
  if (!open) return null
  return (
    <div className="ops-picker-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'grid', placeItems: 'center', zIndex: 50 }} onClick={onClose}>
      <div className="card" style={{ width: 'min(900px, 96vw)', maxHeight: '80vh', overflowY: 'auto', overflowX: 'hidden', padding: 16 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Media Library</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="btn blue">
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
              {uploading ? 'Uploading…' : 'Upload'}
            </label>
            <button className="btn teal" onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 12, alignItems: 'start' }}>
          {list.map(m => (
            <div key={m.id} className="panel" style={{ padding: 8, display: 'grid', gridTemplateRows: 'auto auto auto', gap: 8, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setSelected(m) }}>
              <div className="media-thumb" style={{ width: '100%', aspectRatio: '4 / 3' }}>
                {urls[m.id] ? (
                  <img src={urls[m.id]} alt={m.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--ops-muted)' }}>Preview</div>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ops-muted)', lineHeight: '1.3', maxHeight: '2.6em', overflow: 'hidden', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{m.name}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn blue" onClick={(e) => { e.stopPropagation(); onSelect({ id: m.id }) }} disabled={uploading}>Use</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && (
        // Off-canvas details drawer for media metadata and actions
        <div className="ops-picker-drawer" style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: 360, background: 'var(--ops-blue-2)', color: 'var(--ops-text)', borderLeft: '1px solid var(--ops-border)', zIndex: 60, display: 'grid', gridTemplateRows: 'auto 1fr auto' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ops-border)' }}>
            <strong>Details</strong>
          </div>
          <div style={{ padding: 12, display: 'grid', gap: 10, overflowY: 'auto' }}>
            <div className="media-thumb" style={{ width: '100%', aspectRatio: '4 / 3' }}>
              {selected && (fileUrl ? <img src={fileUrl} alt={selected.name} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} /> : null)}
            </div>
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
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="input" value={fileUrl} onChange={() => {}} readOnly placeholder="https://..." />
                <button className="button" onClick={async () => { try { await navigator.clipboard.writeText(fileUrl || ''); setCopied(true); setTimeout(()=>setCopied(false), 1000) } catch {} }} disabled={!fileUrl}>{copied ? 'Copied' : 'Copy'}</button>
              </div>
              {!!fileUrl && <a href={fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>Open</a>}
            </div>
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--ops-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <button className="button" onClick={() => setSelected(null)}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="button" onClick={async () => {
                if (!selected) return
                try {
                  setSavingMeta(true)
                  const patch = {
                    alt: altText.trim() || undefined,
                    title: titleText.trim() || undefined,
                    name: titleText.trim() || undefined,
                    caption: captionText.trim() || undefined,
                    description: descText.trim() || undefined,
                  } as any
                  await (AssetStore as any).updateMeta?.(selected.id, patch)
                  // Update local list display name
                  setList(prev => prev.map(x => x.id === selected.id ? { ...x, name: patch.name || x.name } : x))
                  // Keep UI inputs in sync with what was saved
                  setAltText(patch.alt || '')
                  setTitleText(patch.title || selected.name || '')
                  setCaptionText(patch.caption || '')
                  setDescText(patch.description || '')
                } finally { setSavingMeta(false) }
              }}>{savingMeta ? 'Saving…' : 'Save'}</button>
              <button className="btn blue" onClick={() => { if (!selected) return; onSelect({ id: selected.id, alt: altText, title: titleText, caption: captionText, description: descText, url: fileUrl }) }}>Use</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

async function compressDataUrl(src: string, maxWidth = 1600, quality = 0.82): Promise<string> {
  return await new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const widths = [maxWidth, 1400, 1200, 1000, 800]
      const qualities = [quality, 0.8, 0.72, 0.65]
      const BASE64_CHAR_LIMIT = 900_000 // ~675KB binary
      const srcMime = /^data:(image\/[a-zA-Z0-9.+-]+);/i.exec(src)?.[1] || 'image/jpeg'
      const preferWebp = srcMime.includes('webp')

      let best: string | null = null

      for (const wTarget of widths) {
        let w = img.width
        let h = img.height
        if (w > wTarget) {
          h = Math.round(h * (wTarget / w))
          w = wTarget
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) break
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, w, h)

        for (const q of qualities) {
          // First try WEBP when appropriate, else JPEG
          let mime = preferWebp ? 'image/webp' : 'image/jpeg'
          let out = canvas.toDataURL(mime, q)
          // If browser doesn't support webp, it returns PNG. Fallback to JPEG to avoid inflated PNGs.
          if (mime === 'image/webp' && out.startsWith('data:image/png')) {
            mime = 'image/jpeg'
            out = canvas.toDataURL(mime, q)
          }

          // Track best (smallest) result
          if (!best || out.length < best.length) best = out

          // Acceptable size
          if (out.length <= BASE64_CHAR_LIMIT) return resolve(out)
        }
      }

      // If we get here, no candidate fit the budget; return the smallest we produced if it beats src
      if (best && best.length < src.length) return resolve(best)
      resolve(src)
    }
    img.onerror = () => resolve(src)
    img.src = src
  })
}

// Formatting helpers for the Body editor toolbar
function getSel(ref: RefObject<HTMLTextAreaElement | null>) {
  const el = ref.current
  if (!el) return { start: 0, end: 0 }
  return { start: el.selectionStart || 0, end: el.selectionEnd || 0 }
}

function spliceText(src: string, start: number, end: number, insert: string) {
  return src.slice(0, start) + insert + src.slice(end)
}

function applyWrap(src: string, ref: RefObject<HTMLTextAreaElement | null>, pre: string, post: string) {
  const { start, end } = getSel(ref)
  const sel = src.slice(start, end) || 'text'
  return spliceText(src, start, end, pre + sel + post)
}

function applyHeading(src: string, ref: RefObject<HTMLTextAreaElement | null>, prefix: string) {
  const { start } = getSel(ref)
  const lineStart = src.lastIndexOf('\n', start - 1) + 1
  const lineEnd = src.indexOf('\n', start)
  const end = lineEnd === -1 ? src.length : lineEnd
  const line = src.slice(lineStart, end)
  const has = line.startsWith(prefix)
  const nextLine = has ? line.replace(prefix, '') : prefix + line
  return src.slice(0, lineStart) + nextLine + src.slice(end)
}

function applyLinePrefix(src: string, ref: RefObject<HTMLTextAreaElement | null>, prefix: string) {
  const { start, end } = getSel(ref)
  const s = src.lastIndexOf('\n', start - 1) + 1
  const eIdx = src.indexOf('\n', end)
  const e = eIdx === -1 ? src.length : eIdx
  const block = src.slice(s, e)
  const lines = block.split('\n').map(l => (l.startsWith(prefix) ? l : (l.trim() ? prefix + l : l)))
  return src.slice(0, s) + lines.join('\n') + src.slice(e)
}

function applyNumberList(src: string, ref: RefObject<HTMLTextAreaElement | null>) {
  const { start, end } = getSel(ref)
  const s = src.lastIndexOf('\n', start - 1) + 1
  const eIdx = src.indexOf('\n', end)
  const e = eIdx === -1 ? src.length : eIdx
  const block = src.slice(s, e)
  const lines = block.split('\n')
  let i = 1
  const out = lines.map(l => (l.trim() ? `${i++}. ${l.replace(/^\d+\.\s+/, '')}` : l))
  return src.slice(0, s) + out.join('\n') + src.slice(e)
}

function applyLink(src: string, ref: RefObject<HTMLTextAreaElement | null>, url: string) {
  const { start, end } = getSel(ref)
  const sel = src.slice(start, end)
  const label = sel || 'link text'
  const insert = `[${label}](${url})`
  return spliceText(src, start, end, insert)
}

// Removed unused applyAlign helper

function applyImage(
  src: string,
  ref: RefObject<HTMLTextAreaElement | null>,
  token: string,
) {
  const { start, end } = getSel(ref)
  const before = src.slice(0, start)
  const after = src.slice(end)
  const sepBefore = /\n\n$/.test(before) ? '' : (/\n$/.test(before) ? '' : '\n\n')
  const ins = `${sepBefore}![image](${token})\n\n`
  return before + ins + after
}

function looksLikeHtml(s: string) {
  return /<\w+[^>]*>/i.test(s)
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
      { target: 'Trucking Accidents', patterns: ['truck accident', 'truck accidents', 'trucking accident', 'trucking accidents', 'semi truck', 'tractor trailer', '18 wheeler', 'big rig', 'commercial truck'] },
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

function enforceEditorialRules(body: string, tags: string[], title: string, excerpt?: string): string {
  try {
    if (looksLikeHtml(body)) {
      const c = document.createElement('div')
      c.innerHTML = body || ''
      // Remove excerpt paragraph if it duplicates the first paragraph
      try {
        const firstP = c.querySelector('p') as HTMLParagraphElement | null
        const ex = (excerpt || '').trim().toLowerCase()
        const ft = (firstP?.textContent || '').trim().toLowerCase()
        if (ex && ft && ex === ft) firstP?.remove()
      } catch {}
      const del = Array.from(c.querySelectorAll('h1,h2,h3,h4,h5,h6,p')).filter(el => {
        const t = (el.textContent || '').trim()
        if (/^introduction:?$/i.test(t) || /^conclusion:?$/i.test(t)) return true
        if (/^excerpt:?$/i.test(t) || /^sources:?$/i.test(t) || /^references:?$/i.test(t)) return true
        if (/^article\s*:\s*/i.test(t)) return true
        if (/\bin focus:\b/i.test(t)) return true
        if (/—\s*article\s*:\s*/i.test(t)) return true
        return false
      })
      del.forEach(el => el.remove())
      const matched = findPracticeAreaLabel(tags, title, c.textContent || '')
      const display = matched ? transformAreaLabelForCta(matched).toLowerCase() : ''
      const cta = matched
        ? `If you or someone you know has been a victim of ${display}, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
        : `If you need legal guidance regarding this topic, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
      // Replace existing CTA paragraph (case-insensitive), or append if missing
      let replaced = false
      try {
        const paras = Array.from(c.querySelectorAll('p')) as HTMLParagraphElement[]
        for (let i = paras.length - 1; i >= 0; i--) {
          const t = (paras[i].textContent || '').trim()
          if (/^if you .*contact goldlaw today/i.test(t)) { paras[i].textContent = cta; replaced = true; break }
        }
      } catch {}
      if (!replaced) {
        const p = document.createElement('p')
        p.textContent = cta
        c.appendChild(p)
      }
      return c.innerHTML
    } else {
      let s = body || ''
      // Drop duplicate first paragraph if it matches excerpt
      try {
        const parts = s.trim().split(/\n\n+/)
        const a = (parts[0] || '').trim().toLowerCase()
        const b = (excerpt || '').trim().toLowerCase()
        if (a && b && a === b) { parts.shift(); s = parts.join('\n\n') }
      } catch {}
      // Strip plain label/section lines (optionally with '#')
      s = s
        .replace(/^\s*(?:#{1,6}\s*)?(Introduction|Conclusion|Excerpt|Sources|References)\s*:?\s*$/gim, '')
        .replace(/^\s*(?:#{1,6}\s*)?Article\s*:\s*.*$/gim, '')
        .replace(/^\s*.*\bin focus:\b.*$/gim, '')
        .replace(/^\s*.*—\s*Article\s*:\s*.*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
      const matched = findPracticeAreaLabel(tags, title, s)
      const display = matched ? transformAreaLabelForCta(matched).toLowerCase() : ''
      const cta = matched
        ? `If you or someone you know has been a victim of ${display}, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
        : `If you need legal guidance regarding this topic, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
      const trimmed = s.replace(/\s+$/, '')
      try {
        const parts = trimmed.split(/\n\n+/)
        if (parts.length > 0) {
          const lastIdx = parts.length - 1
          const last = (parts[lastIdx] || '').trim()
          if (/^if you .*contact goldlaw today/i.test(last)) parts[lastIdx] = cta
          else parts.push(cta)
          s = parts.join('\n\n')
        } else {
          s = cta
        }
      } catch {
        s = trimmed + '\n\n' + cta
      }
      return s
    }
  } catch {
    return body
  }
}

function stampAssetIds(html: string) {
  if (!html) return html
  const container = document.createElement('div')
  container.innerHTML = html
  const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
  for (const img of imgs) {
    const src = img.getAttribute('src') || ''
    if (src.startsWith('asset:')) {
      const id = src.slice(6)
      if (!img.getAttribute('data-asset-id')) img.setAttribute('data-asset-id', id)
    }
  }
  return container.innerHTML
}

function plainToHtml(s: string) {
  if (!s) return '<p></p>'
  const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const blocks = s.trim().split(/\n\n+/)
  return blocks
    .map(b => {
      const t = b.trim()
      // Markdown image as its own block: ![alt](src)
      const imgMatch = t.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
      if (imgMatch) {
        const alt = esc(imgMatch[1] || 'image')
        const src = imgMatch[2]
        return `<img src="${src}" alt="${alt}" />`
      }
      if (/^###\s+/.test(t)) return `<h3>${esc(t.replace(/^###\s+/, ''))}</h3>`
      if (/^##\s+/.test(t)) return `<h2>${esc(t.replace(/^##\s+/, ''))}</h2>`
      if (/^#\s+/.test(t)) return `<h2>${esc(t.replace(/^#\s+/, ''))}</h2>`
      return `<p>${esc(t)}</p>`
    })
    .join('')
}

function SerpPreview({ title, url, description }: { title: string; url: string; description: string }) {
  const t = title || 'Untitled'
  const d = description || ''
  const u = url || ''
  return (
    <div style={{ background: 'var(--ops-blue-2)', border: '1px solid var(--ops-border)', borderRadius: 10, padding: 12, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ color: '#1a0dab', fontSize: 18, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</div>
      <div style={{ color: '#006621', fontSize: 12, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u}</div>
      <div style={{ color: '#545454', fontSize: 13, marginTop: 4 }}>{d}</div>
    </div>
  )
}

function SeoChecks(props: { title: string; slug: string; body: string; excerpt: string; keyphrase: string; metaTitle: string; metaDescription: string }) {
  const txt = looksLikeHtml(props.body) ? htmlText(props.body) : props.body
  const first = firstParagraphText(props.body)
  const titleUse = includesWord(props.metaTitle || props.title, props.keyphrase)
  const slugUse = includesWord(props.slug, props.keyphrase)
  const firstUse = (() => {
    const tokens = (props.keyphrase || '').toLowerCase().match(/[a-z0-9]+/g) || []
    const need = Math.min(2, tokens.length || 1)
    let hits = 0
    const base = (first || '').toLowerCase()
    for (const t of tokens) {
      const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}([^a-z0-9]|$)`, 'i')
      if (re.test(base)) hits++
    }
    return hits >= need
  })()
  const descUse = includesWord(props.metaDescription || props.excerpt, props.keyphrase)
  const headUse = includesHeadings(props.body, props.keyphrase)
  const words = ((txt || '').toLowerCase().replace(/[-_]+/g, ' ').trim().match(/\b[a-z0-9]+\b/g) || []).length
  const hits = countWord(txt, props.keyphrase)
  const density = props.keyphrase ? (hits / Math.max(1, words)) : 0
  const densityOk = density >= 0.005 || (words >= 400 && hits >= 2 && density >= 0.0035)
  const items = [
    { label: 'Keyphrase in title', ok: !!props.keyphrase && titleUse },
    { label: 'Keyphrase in slug', ok: !!props.keyphrase && slugUse },
    { label: 'Keyphrase early in body', ok: !!props.keyphrase && firstUse },
    { label: 'Keyphrase in headings', ok: !!props.keyphrase && headUse },
    { label: 'Keyphrase in meta description', ok: !!props.keyphrase && descUse },
    { label: 'Word count ≥ 300', ok: words >= 300 },
    { label: 'Keyphrase density ~0.5%–2.5%', ok: densityOk && density <= 0.025 },
    { label: 'Meta title ≤ 65 chars', ok: (props.metaTitle || props.title).length <= 65 },
    { label: 'Meta description ≤ 160 chars', ok: (props.metaDescription || props.excerpt).length <= 160 },
  ]
  return (
    <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
      {items.map((it, i) => (
        <div key={i} style={{ fontSize: 12, color: it.ok ? '#16a34a' : '#d97706' }}>{it.ok ? '✓' : '•'} {it.label}</div>
      ))}
    </div>
  )
}

function htmlText(html: string) {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || ''
}

function firstParagraphText(body: string) {
  if (!body) return ''
  if (!looksLikeHtml(body)) {
    const parts = body.trim().split(/\n\n+/)
    return parts[0] || ''
  }
  const el = document.createElement('div')
  el.innerHTML = body
  const p = el.querySelector('p, h2, h3')
  return (p?.textContent || '').trim()
}

function includesWord(text: string, key: string) {
  if (!text || !key) return false
  const t = String(text || '').toLowerCase().replace(/[-_]+/g, ' ')
  const tokens = (String(key || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length >= 3)
  if (tokens.length === 0) return false
  const pattern = tokens.map(escapeRegExp).join('[^a-z0-9]+')
  const re = new RegExp(`(^|[^a-z0-9])${pattern}([^a-z0-9]|$)`, 'i')
  return re.test(t)
}

function countWord(text: string, key: string) {
  if (!text || !key) return 0
  const t = String(text || '').toLowerCase().replace(/[-_]+/g, ' ')
  const tokens = (String(key || '').toLowerCase().match(/[a-z0-9]+/g) || []).filter(w => w.length >= 3)
  let hits = 0
  for (const tok of tokens) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(tok)}([^a-z0-9]|$)`, 'ig')
    hits += (t.match(re) || []).length
  }
  return hits
}

function includesHeadings(body: string, key: string) {
  if (!key) return false
  if (looksLikeHtml(body)) {
    const el = document.createElement('div')
    el.innerHTML = body
    const hs = Array.from(el.querySelectorAll('h1,h2,h3'))
    return hs.some(h => includesWord(h.textContent || '', key))
  }
  // Markdown / plain: consider #/##/### lines and short standalone lines as headings
  const blocks = String(body || '').split(/\n\n+/)
  for (const b of blocks) {
    const line = (b.split('\n')[0] || '').trim()
    if (!line) continue
    let heading = ''
    if (/^#{1,6}\s+/.test(line)) heading = line.replace(/^#{1,6}\s+/, '').trim()
    else if (!/^(-|\*|\d+\.)\s/.test(line)) {
      const words = (line.match(/\b[a-z0-9]+\b/gi) || []).length
      const looksHeading = words > 0 && words <= 10 && !/[.!?:]$/.test(line)
      if (looksHeading) heading = line
    }
    if (heading && includesWord(heading, key)) return true
  }
  return false
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
