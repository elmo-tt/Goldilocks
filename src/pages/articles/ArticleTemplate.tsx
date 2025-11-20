import '@/sections/HowItWorksSection.css'
import '@/sections/HeroSection.css'
import './ArticleTemplate.css'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PRACTICE_AREAS } from '@/admin/data/goldlaw'
import { AssetStore } from '@/shared/assets/store'
import DOMPurify from 'dompurify'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArticlesStore, type Article } from '@/shared/articles/store'
import { useTranslation } from 'react-i18next'
import { ensureSpanishForArticle } from '@/shared/translate/service'

const assetWidthCache = new Map<string, number>()

function filterLangBlocks(s: string, lang: 'en' | 'es') {
  try {
    if (!s) return ''
    let out = String(s)
    // HTML comment markers: <!-- lang:xx --> ... <!-- /lang -->
    out = out.replace(/<!--\s*lang:(en|es)\s*-->([\s\S]*?)<!--\s*\/\s*lang\s*-->/gi, (_m, g1, g2) => (String(g1).toLowerCase() === lang ? g2 : ''))
    // Bracket markers: [lang:xx] ... [/lang]
    out = out.replace(/\[lang:(en|es)\]([\s\S]*?)\[\/lang\]/gi, (_m, g1, g2) => (String(g1).toLowerCase() === lang ? g2 : ''))
    return out
  } catch { return s }
}

function getMarked(s: string, key: 'title' | 'excerpt', lang: 'en' | 'es') {
  try {
    if (!s) return ''
    const reHtml = new RegExp(`<!--\\s*${key}:(en|es)\\s*-->([\\s\\S]*?)<!--\\s*\\/\\s*${key}\\s*-->`, 'gi')
    let m: RegExpExecArray | null
    while ((m = reHtml.exec(s))) {
      if (String(m[1]).toLowerCase() === lang) return String(m[2] || '').trim()
    }
    const reBr = new RegExp(`\\[${key}:(en|es)\\]([\\s\\S]*?)\\[\\/${key}\\]`, 'gi')
    while ((m = reBr.exec(s))) {
      if (String(m[1]).toLowerCase() === lang) return String(m[2] || '').trim()
    }
    return ''
  } catch { return '' }
}

function looksLikeHtml(s: string) {
  return /<(?:\/|[^>]+)>/.test(s)
}

function HtmlBody({ html, heroMaxWidth, excerpt }: { html: string; heroMaxWidth?: number; excerpt?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  // Preprocess: replace src="asset:ID" with a safe placeholder and carry ID via data-asset-id/data-src
  const prepped = html.replace(
    /<img([^>]*?)\s+src=("|')asset:([^"']+)(\2)([^>]*)>/gi,
    (_m, pre, q, id, q2, post) => {
      const placeholder = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
      return `<img${pre} src=${q}${placeholder}${q2} data-asset-id="${id}" data-src=${q}asset:${id}${q2}${post}>`
    }
  )
  const safe = DOMPurify.sanitize(prepped, {
    ADD_ATTR: ['data-asset-id', 'data-width', 'data-align', 'data-caption-for', 'data-src'],
    ALLOW_UNKNOWN_PROTOCOLS: true,
    FORBID_ATTR: ['style'],
    FORBID_TAGS: ['style', 'nobr'],
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let cancelled = false
    const usedIds = new Set<string>()
    const apply = () => {
      // Remove label-only or scaffolding lines that models may output
      try {
        const nodes = Array.from(el.querySelectorAll('p,h1,h2,h3,h4,h5,h6')) as HTMLElement[]
        for (const node of nodes) {
          const t = (node.textContent || '').trim()
          if (/^(Introduction|Conclusion|Excerpt|Sources|References)\s*:?\s*$/i.test(t)) { node.remove(); continue }
          if (/^Article\s*:\s*/i.test(t)) { node.remove(); continue }
          if (/\bin focus:\b/i.test(t)) { node.remove(); continue }
          if (/[–—-]\s*Article\s*:\s*/i.test(t)) { node.remove(); continue }
        }
      } catch {}
      // Remove an early paragraph that duplicates the excerpt
      try {
        if (excerpt && excerpt.trim()) {
          const paras = Array.from(el.querySelectorAll('p')) as HTMLParagraphElement[]
          const maxCheck = Math.min(6, paras.length)
          const ex = excerpt.trim().toLowerCase()
          for (let i = 0; i < maxCheck; i++) {
            const p = paras[i]
            const t = (p.textContent || '').trim().toLowerCase()
            if (t && t === ex) { p.remove(); break }
          }
        }
      } catch {}
      // Cleanup: remove orphaned auto-captions that no longer match the preceding image
      try {
        const autos = Array.from(el.querySelectorAll('p.auto-caption[data-caption-for]')) as HTMLElement[]
        autos.forEach(p => {
          const id = p.getAttribute('data-caption-for') || ''
          const prev = p.previousElementSibling as HTMLElement | null
          let ok = false
          if (prev && prev.tagName.toLowerCase() === 'img') {
            const dataId = prev.getAttribute('data-asset-id') || ''
            const srcPrev = (prev.getAttribute('src') || '')
            const prevIsAsset = srcPrev.startsWith('asset:')
            const prevId = dataId || (prevIsAsset ? srcPrev.slice(6) : '')
            if (prevId && prevId === id) ok = true
          }
          if (!ok) p.remove()
        })
      } catch {}
      const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[]
      imgs.forEach(img => {
        // Constrain images to the article content width so language toggling
        // (which can slightly change hero width) does not rescale inline images.
        img.style.maxWidth = '100%'
        img.style.height = 'auto'
        img.style.display = 'block'
        img.style.borderRadius = '8px'
        const dw = img.getAttribute('data-width')
        const dataIdForWidth = img.getAttribute('data-asset-id') || ''
        const srcForWidth = img.getAttribute('src') || ''
        const isAssetSrcForWidth = srcForWidth.startsWith('asset:')
        const idForWidth = dataIdForWidth || (isAssetSrcForWidth ? srcForWidth.slice(6) : '')
        let pct: number | undefined
        if (idForWidth && assetWidthCache.has(idForWidth)) {
          pct = assetWidthCache.get(idForWidth) as number
        } else if (dw) {
          const parsed = parseInt(dw)
          if (!Number.isNaN(parsed)) {
            pct = Math.max(10, Math.min(100, parsed))
            if (idForWidth) assetWidthCache.set(idForWidth, pct)
          }
        }
        if (pct !== undefined) {
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
        // Always resolve when we have an ID (handles both asset: tokens and expired signed URLs)
        if (id) {
          usedIds.add(id)
          AssetStore.getUrl(id).then(url => {
            if (!cancelled && url) {
              if (img.getAttribute('src') !== url) img.src = url
            }
          })
          // Auto-caption from asset meta if no explicit caption present
          try {
            const next = img.nextElementSibling as HTMLElement | null
            // If there is a mismatched auto-caption immediately after the image, drop it
            if (next && next.tagName.toLowerCase() === 'p') {
              const capId = next.getAttribute('data-caption-for') || ''
              if (capId && capId !== id && next.classList.contains('auto-caption')) {
                next.remove()
              }
            }
            const hasParaCaption = !!(img.nextElementSibling && img.nextElementSibling.tagName.toLowerCase() === 'p' && img.nextElementSibling.getAttribute('data-caption-for') === id)
            const hasFigureCaption = !!(img.parentElement && img.parentElement.tagName.toLowerCase() === 'figure' && !!img.parentElement.querySelector('figcaption'))
            // Clear stale auto-caption flag if no matching caption remains
            if (img.dataset.autoCaption === '1' && !hasParaCaption && !hasFigureCaption) {
              delete (img.dataset as any).autoCaption
            }
            const already = hasParaCaption || hasFigureCaption
            if (!already && (AssetStore as any).getMeta) {
              ;(AssetStore as any).getMeta(id).then((meta: any) => {
                if (cancelled) return
                const cap = (meta?.caption || '').trim()
                if (!cap) return
                // Insert paragraph caption after image
                const p = document.createElement('p')
                p.setAttribute('data-caption-for', id)
                p.className = 'auto-caption'
                p.style.color = 'rgba(255,255,255,0.65)'
                p.style.fontSize = '14px'
                p.style.fontStyle = 'italic'
                p.style.marginTop = '6px'
                p.textContent = cap
                img.insertAdjacentElement('afterend', p)
                img.dataset.autoCaption = '1'
              }).catch(() => {})
            }
          } catch {}
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
    mo.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'data-asset-id', 'data-width', 'data-align'] })
    // Style any paragraphs explicitly marked as captions
    return () => {
      cancelled = true
      mo.disconnect()
      for (const id of usedIds) AssetStore.revokeUrl(id)
    }
  }, [safe, heroMaxWidth])
  return <div ref={ref} style={{ display: 'grid', gap: 14, minWidth: 0, width: '100%' }} dangerouslySetInnerHTML={{ __html: safe }} />
}

export default function ArticleTemplate({ article }: { article: Article }) {
  const { t, i18n } = useTranslation()
  const [heroSrc, setHeroSrc] = useState<string | undefined>(undefined)
  const heroRef = useRef<HTMLImageElement | null>(null)
  const [heroWidth, setHeroWidth] = useState<number | undefined>(undefined)
  const [, setRefreshTick] = useState(0)
  // SEO meta tags
  useEffect(() => {
    const isEs = i18n.language?.startsWith('es')
    const slug = article.slug
    const src = ArticlesStore.getBySlug(slug) || article
    const tTitleEs = isEs ? t(`articles_content.${slug}.title`, { defaultValue: '' }) : ''
    const tExcerptEs = isEs ? t(`articles_content.${slug}.excerpt`, { defaultValue: '' }) : ''
    const tMetaTitleEs = isEs ? t(`articles_content.${slug}.metaTitle`, { defaultValue: '' }) : ''
    const tMetaDescEs = isEs ? t(`articles_content.${slug}.metaDescription`, { defaultValue: '' }) : ''
    const markTitleEs = isEs ? getMarked(src.body || '', 'title', 'es') : ''
    const markExcerptEs = isEs ? getMarked(src.body || '', 'excerpt', 'es') : ''
    const displayTitle = (isEs ? ((src as any).title_es || tTitleEs || markTitleEs) : undefined) || src.title
    const displayExcerpt = (isEs ? (((src as any).excerpt_es || tExcerptEs || markExcerptEs)) : undefined) || src.excerpt || ''
    const title = ((isEs ? (((src as any).metaTitle_es || tMetaTitleEs)) : undefined) || src.metaTitle || '').trim() || displayTitle
    const description = ((isEs ? (((src as any).metaDescription_es || tMetaDescEs)) : undefined) || src.metaDescription || '').trim() || displayExcerpt
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
  }, [i18n.language, article.title, (article as any).title_es, article.metaTitle, (article as any).metaTitle_es, article.metaDescription, (article as any).metaDescription_es, article.excerpt, (article as any).excerpt_es, article.canonicalUrl, article.noindex])

  // Auto-translate on-demand when viewing ES. If forceTranslate=1 is present, always trigger.
  useEffect(() => {
    const isEs = i18n.language?.startsWith('es')
    if (!isEs) return
    const slug = article.slug
    const tTitleEs = t(`articles_content.${slug}.title`, { defaultValue: '' })
    const tBodyEs = t(`articles_content.${slug}.body`, { defaultValue: '' })
    const hasFields = !!(article as any).body_es
    const hasI18n = !!(tTitleEs || tBodyEs)
    const hasMarkers = !!(getMarked(article.body || '', 'title', 'es') || getMarked(article.body || '', 'excerpt', 'es') || /<!--\s*lang:es\s*-->|\[lang:es\]/i.test(article.body || ''))
    const bodyAll = article.body || ''
    const esOnly = filterLangBlocks(bodyAll, 'es').trim()
    const esCoverageOk = esOnly.length > Math.min(bodyAll.length * 0.6, bodyAll.length - 400)
    const force = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('forceTranslate') === '1'
    if (force) {
      ensureSpanishForArticle(article).catch(() => {})
      return
    }
    if (!hasFields && !hasI18n && (!hasMarkers || !esCoverageOk)) {
      ensureSpanishForArticle(article).catch(() => {})
    }
  }, [i18n.language, article.id, article.slug, article.body])

  // Listen for article store updates to re-render with new ES fields
  useEffect(() => {
    const on = () => setRefreshTick(v => v + 1)
    window.addEventListener('gl:articles-updated', on as any)
    return () => window.removeEventListener('gl:articles-updated', on as any)
  }, [])
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
      <section className="hiw article-shell">
        <div className="hiw-inner" style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="article-head" style={{ display: 'grid', rowGap: 16, maxWidth: 840, width: '100%' }}>
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
              {useMemo(() => PRACTICE_AREAS.find(p => p.key === article.category)?.label || t('related.category_fallback'), [article.category, t])}
            </div>
            <h1 className="hiw-title" style={{ margin: 0, fontSize: 40, fontWeight: 400, lineHeight: 1.25, maxWidth: '22ch', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <span className="strong">{(() => {
                const isEs = i18n.language?.startsWith('es')
                const slug = article.slug
                const src = ArticlesStore.getBySlug(slug) || article
                const tTitleEs = isEs ? t(`articles_content.${slug}.title`, { defaultValue: '' }) : ''
                const markTitleEs = isEs ? getMarked(src.body || '', 'title', 'es') : ''
                return (isEs ? ((src as any).title_es || tTitleEs || markTitleEs) : undefined) || src.title
              })()}</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.5)', marginTop: 16, marginBottom: 12, fontSize: 16 }}>
              <span>{formatDate(article.updatedAt || article.createdAt)}</span>
              <span>•</span>
              <span>{(() => {
                const isEs = i18n.language?.startsWith('es')
                const slug = article.slug
                const src = ArticlesStore.getBySlug(slug) || article
                const tBodyEs = isEs ? t(`articles_content.${slug}.body`, { defaultValue: '' }) : ''
                const bodyRaw = (isEs ? ((src as any).body_es || tBodyEs) : undefined) || src.body
                const body = isEs ? filterLangBlocks(bodyRaw || '', 'es') : filterLangBlocks(bodyRaw || '', 'en')
                return readTime(body, t)
              })()}</span>
            </div>
          </div>
        

        {heroSrc && (
          <img ref={heroRef} src={heroSrc} alt={t('articles_template.hero_alt')} onLoad={() => { if (heroRef.current) setHeroWidth(heroRef.current.clientWidth || undefined) }} style={{ width: '100%', borderRadius: 12, margin: '8px 0 6px' }} />
        )}
        {(() => {
          const isEs = i18n.language?.startsWith('es')
          const slug = article.slug
          const src = ArticlesStore.getBySlug(slug) || article
          const tExcerptEs = isEs ? t(`articles_content.${slug}.excerpt`, { defaultValue: '' }) : ''
          const markExcerptEs = isEs ? getMarked(src.body || '', 'excerpt', 'es') : ''
          const ex = (isEs ? ((src as any).excerpt_es || tExcerptEs || markExcerptEs) : undefined) || src.excerpt
          return ex ? (
            <p className="article-excerpt" style={{ margin: '0 0 16px', color: 'rgba(255,255,255,0.78)', maxWidth: 840, width: '100%' }}>{ex}</p>
          ) : null
        })()}

        <div className="article-body" style={{ display: 'grid', gap: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.9)', maxWidth: 840, width: '100%' }}>
          {(() => {
            const isEs = i18n.language?.startsWith('es')
            const slug = article.slug
            const src = ArticlesStore.getBySlug(slug) || article
            const tBodyEs = isEs ? t(`articles_content.${slug}.body`, { defaultValue: '' }) : ''
            const tExcerptEs = isEs ? t(`articles_content.${slug}.excerpt`, { defaultValue: '' }) : ''
            const bodyRaw = (isEs ? ((src as any).body_es || tBodyEs) : undefined) || src.body
            const exRaw = (isEs ? ((src as any).excerpt_es || tExcerptEs) : undefined) || src.excerpt
            const body = isEs ? filterLangBlocks(bodyRaw || '', 'es') : filterLangBlocks(bodyRaw || '', 'en')
            const ex = isEs ? (getMarked(src.body || '', 'excerpt', 'es') || exRaw) : exRaw
            return looksLikeHtml(body) ? (
              <HtmlBody html={body!} heroMaxWidth={heroWidth} excerpt={ex || ''} />
            ) : (
              <BodyRenderer body={body} excerpt={ex} />
            )
          })()}
        </div>

        <div style={{ marginTop: 24 }}>
          <a className="btn primary" href="/#contact">{t('articles_template.contact_cta')}</a>
        </div>
      </div>
    </section>
  </>
)
}

function stripMd(s: string) {
  let x = String(s || '')
  x = x.replace(/`{1,3}[\s\S]*?`{1,3}/g, ' ')
  x = x.replace(/\!\[[^\]]*\]\([^\)]*\)/g, ' ')
  x = x.replace(/\[[^\]]*\]\([^\)]*\)/g, ' ')
  x = x.replace(/^>\s+/gm, ' ')
  x = x.replace(/^\s{0,3}[-*+]\s+/gm, ' ')
  x = x.replace(/^\s*\d+\.\s+/gm, ' ')
  x = x.replace(/^#{1,6}\s+/gm, ' ')
  x = x.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
  x = x.replace(/\s+/g, ' ')
  return x.trim()
}

function normalizeMarkdown(text?: string, excerpt?: string) {
  if (!text) return ''
  let s = text.replace(/\r\n?/g, '\n')
  try {
    if (excerpt && excerpt.trim()) {
      const parts = s.trim().split(/\n\n+/)
      const ex = stripMd(excerpt).toLowerCase()
      const maxCheck = Math.min(6, parts.length)
      let removed = false
      for (let i = 0; i < maxCheck; i++) {
        const a = stripMd(parts[i] || '').toLowerCase()
        if (a && ex && a === ex) { parts.splice(i, 1); removed = true; break }
      }
      if (removed) s = parts.join('\n\n')
    }
  } catch {}
  // Remove label-only or scaffolding lines that models may output
  s = s
    .replace(/^\s*(?:#{1,6}\s*)?(Introduction|Conclusion|Excerpt|Sources|References)\s*:?\s*$/gim, '')
    .replace(/^\s*(?:#{1,6}\s*)?Article\s*:\s*.*$/gim, '')
    .replace(/^\s*.*\bin focus:\b.*$/gim, '')
    .replace(/^\s*.*[–—-]\s*Article\s*:\s*.*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
  // Ensure ordered list markers start at a new line when embedded in a sentence
  s = s.replace(/([^\n])\s(\d+)\.\s/g, '$1\n$2. ')
  // Ensure bullet markers start at a new line
  s = s.replace(/([^\n])\s-\s/g, '$1\n- ')
  // Convert a single caption line following an image into the image title
  // Matches: ![alt](src)\n*Caption*  or _Caption_ or plain text up to 140 chars
  s = s.replace(/!\[([^\]]*)\]\(([^)"\s]+)(?:\s+"([^"]*)")?\)\s*\n\s*(?:\*([^*\n]{1,140})\*|_([^_\n]{1,140})_|([^\n]{1,140}))(?=\n|$)/g,
    (_m, alt: string, url: string, existing: string, em1?: string, em2?: string, plain?: string) => {
      if (existing && String(existing).trim()) return `![${alt}](${url} "${String(existing).trim()}")`
      const cap = (em1 || em2 || plain || '').trim()
      if (!cap) return `![${alt}](${url})`
      return `![${alt}](${url} "${cap}")`
    })
  return s
}

function BodyRenderer({ body, excerpt }: { body?: string; excerpt?: string }) {
  if (!body) return null
  return (
    <div className="mk-body" style={{ minWidth: 0, width: '100%' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props: any) => <a href={props.href} target="_blank" rel="noopener noreferrer">{props.children}</a>,
          img: (props: any) => {
            const src = String(props.src || '')
            const alt = String(props.alt || '')
            const caption = typeof props.title === 'string' && props.title.trim() ? props.title.trim() : ''
            const imgEl = src.startsWith('asset:')
              ? <InlineAssetImage id={src.slice(6)} alt={alt} title={caption} />
              : <img src={src} alt={alt} style={{ width: '100%', borderRadius: 8 }} />
            if (!caption) return imgEl
            return (
              <figure style={{ margin: 0 }}>
                {imgEl}
                <figcaption style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontStyle: 'italic', marginTop: 6 }}>{caption}</figcaption>
              </figure>
            )
          },
          h1: (p: any) => <h2 style={{ color: '#fff', margin: 0 }} {...p} />,
          h2: (p: any) => <h3 style={{ color: '#fff', margin: 0 }} {...p} />,
          h3: (p: any) => <h4 style={{ color: '#fff', margin: 0 }} {...p} />,
          p: (p: any) => <p style={{ margin: 0 }} {...p} />,
          ul: (p: any) => <ul style={{ margin: 0, paddingLeft: 20 }} {...p} />,
          ol: (p: any) => <ol style={{ margin: 0, paddingLeft: 22 }} {...p} />,
          blockquote: (p: any) => <blockquote style={{ margin: 0, paddingLeft: 14, borderLeft: '3px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.85)' }} {...p} />,
        }}
      >
        {normalizeMarkdown(body, excerpt)}
      </ReactMarkdown>
    </div>
  )
}

 

function InlineAssetImage({ id, alt, title }: { id: string; alt?: string; title?: string }) {
  const [url, setUrl] = useState<string | undefined>()
  const [metaCaption, setMetaCaption] = useState<string>('')
  useEffect(() => {
    let mounted = true
    AssetStore.getUrl(id).then(u => { if (mounted) setUrl(u) })
    if ((AssetStore as any).getMeta) {
      ;(AssetStore as any).getMeta(id).then((m: any) => { if (mounted) setMetaCaption((m?.caption || '').trim()) }).catch(() => {})
    }
    return () => { mounted = false; AssetStore.revokeUrl(id) }
  }, [id])
  if (!url) return null
  const cap = (title || metaCaption || '').trim()
  if (!cap) return <img src={url} alt={alt} style={{ width: '100%', borderRadius: 8 }} />
  return (
    <figure style={{ margin: 0 }}>
      <img src={url} alt={alt} style={{ width: '100%', borderRadius: 8 }} />
      <figcaption style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontStyle: 'italic', marginTop: 6 }}>{cap}</figcaption>
    </figure>
  )
}

function formatDate(ts?: number) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
}

function readTime(text?: string, t?: (key: string, opts?: any) => string) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length
  const mins = Math.max(1, Math.round(words / 225))
  return t ? t('articles_page.min_read', { count: mins }) : `${mins} min read`
}
