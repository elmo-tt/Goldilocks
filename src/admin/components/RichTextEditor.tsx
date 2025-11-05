import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import { AssetStore } from '@/shared/assets/store'

export default function RichTextEditor({ value, onChange, onPickAsset, registerApi }: {
  value: string
  onChange: (html: string) => void
  onPickAsset: () => void
  registerApi?: (api: { insertImage: (token: string) => void; insertMedia?: (info: { id: string; src?: string; alt?: string; title?: string; caption?: string; description?: string; widthPct?: number }) => void }) => void
}) {
  const lastEmittedRef = useRef<string>('')
  const [, forceRerender] = useState(0)
  const ResizableImage = Image.extend({
    selectable: true,
    addAttributes() {
      const parentAttrs = (this as any).parent?.() || {}
      return {
        ...parentAttrs,
        'data-width': {
          default: null,
          parseHTML: (el: HTMLElement) => el.getAttribute('data-width'),
          renderHTML: (attrs: Record<string, any>) => attrs['data-width'] ? { 'data-width': attrs['data-width'] } : {},
        },
        'data-asset-id': {
          default: null,
          parseHTML: (el: HTMLElement) => el.getAttribute('data-asset-id'),
          renderHTML: (attrs: Record<string, any>) => attrs['data-asset-id'] ? { 'data-asset-id': attrs['data-asset-id'] } : {},
        },
        'data-align': {
          default: null,
          parseHTML: (el: HTMLElement) => el.getAttribute('data-align'),
          renderHTML: (attrs: Record<string, any>) => attrs['data-align'] ? { 'data-align': attrs['data-align'] } : {},
        },
      }
    },
  })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      ResizableImage.configure({ allowBase64: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }: any) => {
      // Normalize HTML so resolved preview URLs (blob:) are not persisted.
      const raw = editor.getHTML()
      const container = document.createElement('div')
      container.innerHTML = raw
      const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
      for (const img of imgs) {
        const src = img.getAttribute('src') || ''
        const existingId = img.getAttribute('data-asset-id') || ''
        const id = existingId || (src.startsWith('asset:') ? src.slice(6) : '')
        if (id) {
          img.setAttribute('data-asset-id', id)
          // Preserve tokens in the saved HTML string only (not mutating the live editor DOM)
          img.setAttribute('src', `asset:${id}`)
        }
      }
      const normalized = container.innerHTML
      if (normalized !== lastEmittedRef.current) {
        lastEmittedRef.current = normalized
        onChange(normalized)
      }
    },
    editorProps: {
      attributes: { class: 'input rich-editor', style: 'min-height:180px; overflow:auto' },
    },
  })

  // Expose an insertion API to parent so it can insert after Media modal selection
  useEffect(() => {
    if (!registerApi || !editor) return
    const api = {
      insertImage: (token: string) => {
        try {
          const id = token.startsWith('asset:') ? token.slice(6) : undefined
          const chain = editor.chain().focus().setImage({ src: token })
          if (id) {
            chain.updateAttributes('image', { 'data-asset-id': id, 'data-width': '50' })
          } else {
            chain.updateAttributes('image', { 'data-width': '50' })
          }
          chain.run()
        } catch {}
      },
      insertMedia: (info: { id: string; src?: string; alt?: string; title?: string; caption?: string; description?: string; widthPct?: number }) => {
        try {
          const id = info.id
          const src = info.src || `asset:${id}`
          const alt = info.alt || ''
          const title = info.title || ''
          const width = Math.max(10, Math.min(100, Math.round(info.widthPct || 50)))
          const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          const attrs: string[] = []
          attrs.push(`src="${esc(src)}"`)
          if (alt) attrs.push(`alt="${esc(alt)}"`)
          if (title) attrs.push(`title="${esc(title)}"`)
          if (id) attrs.push(`data-asset-id="${id}"`)
          attrs.push(`data-width="${String(width)}"`)
          if (info.description) attrs.push(`data-description="${esc(info.description)}"`)
          let html = `<img ${attrs.join(' ')} />`
          if (info.caption) {
            html += `<p data-caption-for="${id}"><em>${esc(info.caption)}</em></p>`
          }
          editor.chain().focus().insertContent(html).run()
        } catch {}
      }
    }
    registerApi(api)
  }, [editor, registerApi])

  useEffect(() => {
    if (!editor) return
    const root = (editor as any).view?.dom as HTMLElement | undefined
    if (!root) return
    const apply = () => {
      try {
        const imgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
        for (const img of imgs) {
          // Apply width from data-width
          const dw = img.getAttribute('data-width')
          if (dw) {
            const pct = Math.max(10, Math.min(100, parseInt(dw)))
            img.style.width = pct + '%'
            img.style.maxWidth = '100%'
            img.style.height = 'auto'
            img.style.display = 'block'
          }
          // Resolve asset token to preview URL once
          const src = img.getAttribute('src') || ''
          if (src.startsWith('asset:') && !img.dataset.assetResolved) {
            const id = src.slice(6)
            img.dataset.assetId = id
            AssetStore.getUrl(id)
              .then((u) => {
                if (!u) return
                const cur = img.getAttribute('src') || ''
                if (cur.startsWith('asset:')) {
                  img.src = u
                  img.dataset.assetResolved = 'true'
                }
              })
              .catch(() => {})
          }
        }
      } catch {}
    }
    // Initial pass
    apply()
    const obs = new MutationObserver(() => apply())
    obs.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'data-asset-id', 'data-width'] })
    return () => { obs.disconnect() }
  }, [editor])

  // Force toolbar to re-render on selection changes so isActive('image') reflects current selection
  useEffect(() => {
    if (!editor) return
    const rerender = () => forceRerender((t) => t + 1)
    editor.on('selectionUpdate', rerender)
    editor.on('focus', rerender)
    editor.on('blur', rerender)
    editor.on('update', rerender)
    return () => {
      editor.off('selectionUpdate', rerender)
      editor.off('focus', rerender)
      editor.off('blur', rerender)
      editor.off('update', rerender)
    }
  }, [editor])

  useEffect(() => {
    if (!editor) return
    // Update content if value changes externally
    const current = editor.getHTML()
    const normalizeToTokens = (html: string) => {
      const c = document.createElement('div')
      c.innerHTML = html
      const imgs = Array.from(c.querySelectorAll('img')) as HTMLImageElement[]
      for (const img of imgs) {
        const src = img.getAttribute('src') || ''
        const existingId = img.getAttribute('data-asset-id') || ''
        const id = existingId || (src.startsWith('asset:') ? src.slice(6) : '')
        if (id) {
          img.setAttribute('data-asset-id', id)
          img.setAttribute('src', `asset:${id}`)
        }
      }
      return c.innerHTML
    }
    const normalizedCurrent = normalizeToTokens(current)
    if (!value || value === normalizedCurrent) return
    lastEmittedRef.current = value
    try {
      const container = document.createElement('div')
      container.innerHTML = value
      const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[]
      for (const img of imgs) {
        const src = img.getAttribute('src') || ''
        if (src.startsWith('asset:')) {
          const id = src.slice(6)
          img.setAttribute('data-asset-id', id)
          // Keep token in the content string; preview will be resolved after setContent
          img.setAttribute('src', `asset:${id}`)
        }
      }
      editor.commands.setContent(container.innerHTML)
      // Resolve previews once after setting content
      setTimeout(() => {
        try {
          const root = (editor as any).view?.dom as HTMLElement | undefined
          if (!root) return
          const liveImgs = Array.from(root.querySelectorAll('img')) as HTMLImageElement[]
          liveImgs.forEach((img) => {
            const src = img.getAttribute('src') || ''
            if (src.startsWith('asset:')) {
              const id = src.slice(6)
              AssetStore.getUrl(id).then((u) => { if (u) img.src = u }).catch(() => {})
            }
          })
        } catch {}
      }, 0)
    } catch {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleUnderline().run()}>U</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleCode().run()}>Code</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>• List</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
        <button type="button" className="button" onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</button>
        <button type="button" className="button" onClick={() => {
          if (editor.isActive('image')) editor.chain().focus().updateAttributes('image', { 'data-align': 'left' }).run()
          else editor.chain().focus().setTextAlign('left').run()
        }}>L</button>
        <button type="button" className="button" onClick={() => {
          if (editor.isActive('image')) editor.chain().focus().updateAttributes('image', { 'data-align': 'center' }).run()
          else editor.chain().focus().setTextAlign('center').run()
        }}>C</button>
        <button type="button" className="button" onClick={() => {
          if (editor.isActive('image')) editor.chain().focus().updateAttributes('image', { 'data-align': 'right' }).run()
          else editor.chain().focus().setTextAlign('right').run()
        }}>R</button>
        <button type="button" className="button" onClick={() => { try { onPickAsset() } catch {} }}>Add Media</button>
        {editor.isActive('image') && (
          <div style={{ display:'inline-flex', gap:6, alignItems:'center', marginLeft:6 }}>
            <span style={{ fontSize:12, opacity:.8 }}>Image size:</span>
            <button type="button" className="button" onClick={() => editor.chain().updateAttributes('image', { 'data-width': '25' }).focus().run()}>25%</button>
            <button type="button" className="button" onClick={() => editor.chain().updateAttributes('image', { 'data-width': '50' }).focus().run()}>50%</button>
            <button type="button" className="button" onClick={() => editor.chain().updateAttributes('image', { 'data-width': '75' }).focus().run()}>75%</button>
            <button type="button" className="button" onClick={() => editor.chain().updateAttributes('image', { 'data-width': '100' }).focus().run()}>100%</button>
          </div>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
