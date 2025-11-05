import '@/sections/HowItWorksSection.css'
import '@/sections/HeroSection.css'
import './ArticleTemplate.css'
import { useEffect, useRef, useState } from 'react'
import { AssetStore } from '@/shared/assets/store'
import DOMPurify from 'dompurify'
import type { Article } from '@/shared/articles/store'

function looksLikeHtml(s: string) {
  return /<(?:\/|[^>]+)>/.test(s)
}

function HtmlBody({ html, heroMaxWidth }: { html: string; heroMaxWidth?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  // Preprocess: also stamp data-asset-id while keeping src="asset:ID" intact
  const prepped = html.replace(
    /<img([^>]*?)\s+src=("|')asset:([^"']+)(\2)([^>]*)>/gi,
    (m, pre, q, id, q2, post) => {
      // If data-asset-id is already present, keep as-is; else add it
      return /data-asset-id=/i.test(m) ? m : `<img${pre} src=${q}asset:${id}${q2} data-asset-id="${id}"${post}>`
    }
  )
  const safe = DOMPurify.sanitize(prepped, { ADD_ATTR: ['data-asset-id', 'data-width', 'data-align', 'data-caption-for'], ALLOW_UNKNOWN_PROTOCOLS: true })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    const usedIds = new Set<string>()
    const apply = () => {
      const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[]
      imgs.forEach(img => {
        // Constrain images to hero width (if provided) and apply optional data-width percentage
        img.style.maxWidth = heroMaxWidth ? `${heroMaxWidth}px` : '100%'
        img.style.height = 'auto'
        img.style.display = 'block'
        img.style.borderRadius = '8px'
        const dw = img.getAttribute('data-width')
        if (dw) {
          const pct = Math.max(10, Math.min(100, parseInt(dw)))
          img.style.width = pct + '%'
        } else {
          img.style.width = ''
        }
        // Apply alignment
        const da = img.getAttribute('data-align')
        if (da === 'center') {
          img.style.marginLeft = 'auto'
          img.style.marginRight = 'auto'
          img.style.display = 'block'
        } else if (da === 'right') {
          img.style.marginLeft = 'auto'
          img.style.marginRight = '0'
          img.style.display = 'block'
        } else {
          img.style.marginLeft = '0'
          img.style.marginRight = '0'
        }
        // Prefer data-asset-id if present
        const dataId = img.getAttribute('data-asset-id') || ''
        const src = img.getAttribute('src') || ''
        const isAssetSrc = src.startsWith('asset:')
        const id = dataId || (isAssetSrc ? src.slice(6) : '')
        if (id) {
          usedIds.add(id)
          AssetStore.getUrl(id).then(url => {
            if (!cancelled && url) img.src = url
          })
        }
      })
      // Style any paragraphs explicitly marked as captions
      const marked = Array.from(el.querySelectorAll('p[data-caption-for]')) as HTMLElement[]
      marked.forEach(p => {
        p.style.color = 'rgba(255,255,255,0.65)'
        p.style.fontSize = '14px'
        p.style.fontStyle = 'italic'
        p.style.marginTop = '6px'
      })
      // Also style any figcaptions present
      const captions = Array.from(el.querySelectorAll('figcaption')) as HTMLElement[]
      captions.forEach(fc => {
        fc.style.color = 'rgba(255,255,255,0.65)'
        fc.style.fontSize = '14px'
        fc.style.fontStyle = 'italic'
        fc.style.marginTop = '6px'
      })
    }
    // Initial apply
    apply()
    // Re-apply on attribute mutations so changes show without needing DevTools
    const mo = new MutationObserver(() => apply())
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-width', 'data-align', 'src'] })
    // Style any paragraphs explicitly marked as captions
    return () => {
      cancelled = true
      mo.disconnect()
      for (const id of usedIds) AssetStore.revokeUrl(id)
    }
  }, [safe, heroMaxWidth])
  return <div ref={ref} style={{ display: 'grid', gap: 14 }} dangerouslySetInnerHTML={{ __html: safe }} />
}

export default function ArticleTemplate({ article }: { article: Article }) {
  const [heroSrc, setHeroSrc] = useState<string | undefined>(undefined)
  const heroRef = useRef<HTMLImageElement | null>(null)
  const [heroWidth, setHeroWidth] = useState<number | undefined>(undefined)
  // SEO meta tags
  useEffect(() => {
    const title = (article.metaTitle && article.metaTitle.trim()) || article.title
    const description = (article.metaDescription && article.metaDescription.trim()) || article.excerpt || ''
    const canonical = (article.canonicalUrl && article.canonicalUrl.trim()) || ''
    const noindex = !!article.noindex

    const prevTitle = document.title
    document.title = title

    const ensureMeta = (name: string) => {
      let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el) }
      return el
    }
    const descEl = ensureMeta('description')
    const prevDesc = descEl.getAttribute('content') || ''
    descEl.setAttribute('content', description)

    // robots
    const robotsEl = ensureMeta('robots')
    const prevRobots = robotsEl.getAttribute('content') || ''
    if (noindex) robotsEl.setAttribute('content', 'noindex, follow')
    else robotsEl.setAttribute('content', 'index, follow')

    // canonical
    let linkEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!linkEl) { linkEl = document.createElement('link'); linkEl.setAttribute('rel', 'canonical'); document.head.appendChild(linkEl) }
    const prevCanonical = linkEl.getAttribute('href') || ''
    if (canonical) linkEl.setAttribute('href', canonical)
    else linkEl.removeAttribute('href')

    return () => {
      document.title = prevTitle
      if (prevDesc) descEl.setAttribute('content', prevDesc)
      if (prevRobots) robotsEl.setAttribute('content', prevRobots)
      else robotsEl.removeAttribute('content')
      if (prevCanonical) linkEl.setAttribute('href', prevCanonical)
      else linkEl.removeAttribute('href')
    }
  }, [article.metaTitle, article.title, article.metaDescription, article.excerpt, article.canonicalUrl, article.noindex])
  useEffect(() => {
    let revokeId: string | null = null
    let cancelled = false
    const run = async () => {
      if (article.heroDataUrl) { setHeroSrc(article.heroDataUrl); return }
      if (article.heroUrl) {
        if (article.heroUrl.startsWith('asset:')) {
          const id = article.heroUrl.slice(6)
          const url = await AssetStore.getUrl(id)
          if (!cancelled) setHeroSrc(url)
          revokeId = id
        } else {
          setHeroSrc(article.heroUrl)
        }
      } else {
        setHeroSrc(undefined)
      }
    }
    run()
    return () => { cancelled = true; if (revokeId) AssetStore.revokeUrl(revokeId) }
  }, [article.heroDataUrl, article.heroUrl])
  useEffect(() => {
    const measure = () => {
      if (heroRef.current) setHeroWidth(heroRef.current.clientWidth || undefined)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [heroSrc])
  return (
    <>
      <section className="hiw" style={{ paddingTop: 145 }}>
        <div className="hiw-inner" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', rowGap: 16 }}>
            <div
              className="eyebrow"
              style={{
                fontSize: 16,
                backgroundImage: 'linear-gradient(90deg, #8E6F18, #E1D3AD)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                fontWeight: 700,
              }}
            >
              {article.tags?.[0] || 'Article'}
            </div>
            <h1 className="hiw-title" style={{ margin: 0, fontSize: 40, fontWeight: 400, lineHeight: 1.25 }}>
              <span className="strong">{article.title}</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.5)', marginTop: 16, marginBottom: 12, fontSize: 16 }}>
              <span>{formatDate(article.updatedAt || article.createdAt)}</span>
              <span>•</span>
              <span>{readTime(article.body)}</span>
            </div>
          </div>

          {heroSrc && (
            <img ref={heroRef} src={heroSrc} alt="hero" onLoad={() => { if (heroRef.current) setHeroWidth(heroRef.current.clientWidth || undefined) }} style={{ width: '100%', borderRadius: 12, margin: '8px 0 6px' }} />
          )}
          {article.excerpt && (
            <p className="article-excerpt" style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.78)' }}>{article.excerpt}</p>
          )}

          <div className="article-body" style={{ display: 'grid', gap: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', maxWidth: 840 }}>
            {looksLikeHtml(article.body) ? (
              <HtmlBody html={article.body!} heroMaxWidth={heroWidth} />
            ) : (
              <BodyRenderer body={article.body} />
            )}
          </div>

          <div style={{ marginTop: 24 }}>
            <a className="btn primary" href="/#contact">Contact GOLDLAW</a>
          </div>
        </div>
      </section>
    </>
  )
}

function BodyRenderer({ body }: { body?: string }) {
  if (!body) return null
  const lines = body.replace(/\r\n?/g, '\n').split('\n')
  const out: React.ReactNode[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    // Headings
    if (/^###\s+/.test(line)) { out.push(<h3 key={i} style={{ color: '#fff', margin: 0 }}>{line.replace(/^###\s+/, '')}</h3>); i++; continue }
    if (/^##\s+/.test(line)) { out.push(<h2 key={i} style={{ color: '#fff', margin: 0 }}>{line.replace(/^##\s+/, '')}</h2>); i++; continue }
    if (/^#\s+/.test(line)) { out.push(<h2 key={i} style={{ color: '#fff', margin: 0 }}>{line.replace(/^#\s+/, '')}</h2>); i++; continue }
    // Image line ![alt](src)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
    if (imgMatch) {
      const alt = imgMatch[1]
      const src = imgMatch[2]
      if (src.startsWith('asset:')) out.push(<InlineAssetImage key={`img-${i}`} id={src.slice(6)} alt={alt} />)
      else out.push(<img key={`img-${i}`} src={src} alt={alt} style={{ width: '100%', borderRadius: 8 }} />)
      i++; continue
    }
    // Unordered list block
    if (/^-\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^-\s+/.test(lines[i])) { items.push(lines[i].replace(/^-\s+/, '')); i++ }
      out.push(
        <ul key={`ul-${i}`} style={{ margin: 0, paddingLeft: 20 }}>
          {items.map((t, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: mdInlineToHtml(t) }} />)}
        </ul>
      )
      continue
    }
    // Ordered list block
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++ }
      out.push(
        <ol key={`ol-${i}`} style={{ margin: 0, paddingLeft: 22 }}>
          {items.map((t, idx) => <li key={idx} dangerouslySetInnerHTML={{ __html: mdInlineToHtml(t) }} />)}
        </ol>
      )
      continue
    }
    // Blockquote
    if (/^>\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^>\s+/.test(lines[i])) { items.push(lines[i].replace(/^>\s+/, '')); i++ }
      out.push(
        <blockquote key={`q-${i}`} style={{ margin: 0, paddingLeft: 14, borderLeft: '3px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }}>
          {items.map((t, idx) => <p key={idx} style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: mdInlineToHtml(t) }} />)}
        </blockquote>
      )
      continue
    }
    // Paragraph (allow inline HTML formatting)
    out.push(<p key={`p-${i}`} style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: mdInlineToHtml(line) }} />)
    i++
  }
  return <>{out}</>
}

function mdInlineToHtml(s: string) {
  // very small inline Markdown to HTML
  let html = s
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  return html
}

function InlineAssetImage({ id, alt }: { id: string; alt?: string }) {
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    let mounted = true
    AssetStore.getUrl(id).then(u => { if (mounted) setUrl(u) })
    return () => { mounted = false; AssetStore.revokeUrl(id) }
  }, [id])
  if (!url) return null
  return <img src={url} alt={alt} style={{ width: '100%', borderRadius: 8 }} />
}

function formatDate(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

function readTime(text?: string) {
  if (!text) return '1 min read'
  const words = text.trim().split(/\s+/).length
  const mins = Math.max(1, Math.round(words / 225))
  return `${mins} min read`
}
