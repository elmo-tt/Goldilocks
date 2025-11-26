export const handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: 'Method Not Allowed' }
  }
  let body
  try { body = JSON.parse(event.body || '{}') } catch { body = {} }
  const mode = String(body.mode || 'copilot')
  const primaryPrefEarly = String(process.env.TRANSLATE_PRIMARY || '').toLowerCase()
  const allowNoOpenAI = (mode === 'translate') && (primaryPrefEarly === 'deepl' || primaryPrefEarly === 'azure')
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey && !allowNoOpenAI) {
    return { statusCode: 500, headers: cors, body: 'Missing OPENAI_API_KEY' }
  }
  const incoming = Array.isArray(body.messages) ? body.messages : []
  const model = body.model || process.env.COPILOT_MODEL || 'gpt-4o'
  const temperature = Number(process.env.COPILOT_TEMPERATURE ?? body.temperature ?? 0.3)
  // Allow env/body to fully control max_tokens; use a higher default so we aren't artificially capping articles at ~900 tokens.
  const max_tokens = Number(process.env.COPILOT_MAX_TOKENS ?? body.max_tokens ?? 2400)

  const sys = {
    role: 'system',
    content: [
      'You are the GOLDLAW Copilot. Answer concisely and helpfully.',
      'Format your responses in Markdown (GFM). Prefer short sections with headings, bullet/numbered lists, and inline links like [Title](https://...). Use bold for key labels.',
      'You may call tools when appropriate: createTask, navigate, call, map, fetchUrl, searchWeb, createArticle.',
      // Article workflow with SEO
      'When asked to write an article from web sources: (1) use fetchUrl for every provided URL in the user message (treat them as primary sources), (2) optionally use searchWeb (3–5 results) if available, (3) present a brief "Sources" list as bullets with links, (4) present a short excerpt and a structured article body with headings, (5) call createArticle with { title, excerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl, status }. Keep metaTitle ~60 chars, metaDescription ~155 chars. Tags should be 1–5 short topic labels. Stay strictly on-topic with the fetched sources; do not pivot to unrelated topics.',
      'For substantial practice-area articles (e.g., about statutes, deadlines, or major legal changes), aim for a comprehensive landing-page style piece: multiple H2/H3 sections, practical timelines and steps, explanation of legal rules and their real-world impact, how a West Palm Beach lawyer can help, 2–5 short "Pro Tip" callouts, a brief FAQ section, and a strong, localized GOLDLAW call-to-action at the end.',
      'When you create a new article, choose a clear primary SEO keyphrase and set the article keyphrase to that exact string. After you pick the keyphrase, copy-paste that exact string into the H1 (or first main heading) and into at least two H2 or H3 headings, even if it feels slightly repetitive, while still keeping headings readable for humans.',
      'In the body text of long-form articles, repeat that exact keyphrase string multiple times so that its density is roughly between about 0.5% and 2.5% of the total word count. Do not make adjacent sentences all start with the keyphrase, but do reuse the exact phrase verbatim in several paragraphs to help satisfy strict SEO checks.',
      'If searchWeb is unavailable, proceed using provided fetchUrl content only and do not fabricate sources. If a provided URL fetch fails or is irrelevant, ask for another URL or clarification before drafting.',
      'When asked to modify an existing article: you MUST call updateArticle with an identifier (slug or id) plus only the fields to change. If you cannot uniquely identify the article, ask a brief clarifying question (offer 1–3 likely titles) and do not claim completion.',
      'Do NOT say "Done" unless you actually invoked a tool (e.g., updateArticle/createArticle) successfully.',
      'Ask for confirmation if a destructive or uncertain action is requested. If the user says "yes"/"proceed", go ahead and call the tool.',
      'If answering without tools, keep replies brief and actionable.'
    ].join(' ')
  }
  const looksLikeArticlePrompt = (s = '') => {
    try {
      const text = String(s || '').toLowerCase()
      if (!text.trim()) return false
      const mentionsArticle = /\b(article|blog|guide|landing page)\b/.test(text)
      const mentionsDraft = /\b(draft|write|create|generate|develop)\b/.test(text)
      const topicWords = /(truck|accident|injury|negligence|statute|deadline|limitations?|law|lawsuit|claim)/.test(text)
      const longFormHints = /(comprehensive|in-depth|long-form|practice area|landing page|detailed)/.test(text)
      return (mentionsArticle && (mentionsDraft || topicWords)) || longFormHints
    } catch { return false }
  }
  const messages = [sys, ...incoming.map(m => ({ role: m.role, content: String(m.content || '') }))]
  const lastUserText = String(incoming[incoming.length - 1]?.content || '')
  if (looksLikeArticlePrompt(lastUserText)) {
    const longFormMsg = {
      role: 'system',
      content: [
        'User is requesting a comprehensive long-form legal article, similar to a practice-area landing page, not a short news blurb.',
        'Respond with a structured article as described: multiple H2/H3 sections, practical timelines and steps, explanation of the law and its impact, how a West Palm Beach GOLDLAW lawyer can help, several concise "Pro Tip" callouts, a short FAQ, and a strong localized call-to-action at the end.',
      ].join(' '),
    }
    messages.push(longFormMsg)
  }
  const tools = [
    {
      type: 'function',
      function: {
        name: 'createTask',
        description: 'Create a task in the admin task list with a concise title.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short task title' }
          },
          required: ['title']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'navigate',
        description: 'Navigate to a section in the admin.',
        parameters: {
          type: 'object',
          properties: {
            target: { type: 'string', enum: ['overview','intake','cases','tasks','calendar','marketing','articles','media','settings'] }
          },
          required: ['target']
        }
      }
    },
    { type: 'function', function: { name: 'call', description: 'Initiate a phone call to GOLDLAW number.', parameters: { type: 'object', properties: {} } } },
    { type: 'function', function: { name: 'map', description: 'Open map for an office.', parameters: { type: 'object', properties: { office: { type: 'string', enum: ['wpb','psl'] } }, required: ['office'] } } },
    {
      type: 'function',
      function: {
        name: 'fetchUrl',
        description: 'Fetch a public web page and return a readable title and plain text content (trimmed).',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'Absolute URL to fetch (http/https)' }
          },
          required: ['url']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'searchWeb',
        description: 'Search the web for recent information (uses server search API if configured).',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            maxResults: { type: 'number' }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'createArticle',
        description: 'Create an article in the admin. This is executed on the client. Include SEO fields when possible.',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            body: { type: 'string' },
            excerpt: { type: 'string' },
            // SEO fields
            tags: { type: 'array', items: { type: 'string' } },
            keyphrase: { type: 'string' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            canonicalUrl: { type: 'string' },
            noindex: { type: 'boolean' },
            // Draft or published
            status: { type: 'string', enum: ['draft','published'] }
          },
          required: ['title']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'updateArticle',
        description: 'Update an existing article identified by id or slug. This is executed on the client.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            slug: { type: 'string' },
            title: { type: 'string' },
            body: { type: 'string' },
            excerpt: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            keyphrase: { type: 'string' },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            canonicalUrl: { type: 'string' },
            noindex: { type: 'boolean' },
            status: { type: 'string', enum: ['draft','published'] }
          },
          // Note: We cannot enforce mutual requirement here; the system prompt instructs the model to provide id or slug and to ask to clarify if ambiguous.
        }
      }
    }
  ]

  try {
    if (mode === 'translate') {
      const sysText = [
        'You are a professional English→Spanish (LATAM) translator for legal blog content.',
        'Maintain Markdown structure, headings, links, and image references.',
        'Return JSON ONLY with keys: title, excerpt, body, metaTitle, metaDescription. No prose, no code fences.'
      ].join(' ')
      const userPrompt = String(body.prompt || '')
      const temp = body.temperature ?? 0.2
      const maxOut = body.max_tokens ?? 2000
      const isProjectKey = /^sk-?proj-/i.test(apiKey)
      const headersBase = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' }
      const orgHdr = process.env.OPENAI_ORG ? { 'OpenAI-Organization': process.env.OPENAI_ORG } : {}
      const projHdr = process.env.OPENAI_PROJECT ? { 'OpenAI-Project': process.env.OPENAI_PROJECT } : {}
      const headers = isProjectKey ? { ...headersBase } : { ...headersBase, ...orgHdr, ...projHdr }

      const requested = String(body.model || process.env.COPILOT_MODEL || '').trim()
      const models = Array.from(new Set([
        requested,
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4.1-mini',
        'gpt-4.1'
      ].filter(Boolean)))

      const inputText = `${sysText}\n\n${userPrompt}`
      const providersUsed = new Set()

      // Helpers: no-key fallback translator
      const chunkText = (s, max = 450) => {
        const text = String(s || '')
        if (!text.trim()) return []
        if (text.length <= max) return [text]
        const out = []
        let i = 0
        while (i < text.length) {
          let j = Math.min(text.length, i + max)
          const slice = text.slice(i, j)
          // try to split at last period/newline
          let k = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf('.'))
          if (k < 60) k = slice.length
          out.push(slice.slice(0, k))
          i += k
        }
        return out
      }
      const looksLikeHtml = (s) => /<(?:\/|[^>]+)>/.test(String(s || ''))
      const tryLibre = async (text) => {
        if (!String(text || '').trim()) return ''
        const payload = { q: text, source: 'en', target: 'es', format: 'text' }
        const eps = ['https://libretranslate.de/translate', 'https://translate.astian.org/translate']
        for (const ep of eps) {
          try {
            const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            const j = await r.json().catch(async () => ({ error: await r.text().catch(()=> '') }))
            if (r.ok && j && typeof j.translatedText === 'string') { providersUsed.add('libre'); return j.translatedText }
          } catch {}
        }
        return ''
      }
      const tryMyMemory = async (text) => {
        if (!String(text || '').trim()) return ''
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`
        try {
          const r = await fetch(url)
          const j = await r.json().catch(async () => ({ responseData: { translatedText: '' } }))
          const t = String(j?.responseData?.translatedText || '')
          if (t) providersUsed.add('mymemory')
          return t
        } catch { return '' }
      }
      const fallbackTranslate = async (text) => {
        if (!String(text || '').trim()) return ''
        const pieces = chunkText(text, 420)
        if (!pieces.length) return ''
        const out = []
        for (const p of pieces) {
          let es = await tryLibre(p)
          if (!es) es = await tryMyMemory(p)
          out.push(es || p)
        }
        return out.join('')
      }
      const translateWithAzure = async (text) => {
        if (!String(text || '').trim()) return ''
        const key = process.env.AZURE_TRANSLATOR_KEY
        const region = process.env.AZURE_TRANSLATOR_REGION || 'global'
        const base = process.env.AZURE_TRANSLATOR_ENDPOINT || 'https://api.cognitive.microsofttranslator.com'
        if (!key) return ''
        const pieces = chunkText(text, 420)
        if (!pieces.length) return ''
        try {
          const bodyArr = pieces.map(t => ({ Text: t }))
          const url = `${base.replace(/\/$/, '')}/translate?api-version=3.0&from=en&to=es`
          const r = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Ocp-Apim-Subscription-Key': key,
              'Ocp-Apim-Subscription-Region': region
            },
            body: JSON.stringify(bodyArr)
          })
          const j = await r.json().catch(async () => ({ error: await r.text().catch(()=> '') }))
          if (!r.ok || !Array.isArray(j)) return ''
          const out = []
          for (const item of j) {
            const t = String(item?.translations?.[0]?.text || '')
            out.push(t)
          }
          const textOut = out.join('')
          if (textOut) providersUsed.add('azure')
          return textOut
        } catch { return '' }
      }
      const translateWithDeepL = async (text) => {
        if (!String(text || '').trim()) return ''
        const key = process.env.DEEPL_API_KEY
        if (!key) return ''
        const base = (process.env.DEEPL_API_URL || 'https://api.deepl.com/v2/translate').replace(/\/$/, '')
        const glossary = String(process.env.TRANSLATE_GLOSSARY || '').split(',').map(s => s.trim()).filter(Boolean)
        const protect = (s) => {
          if (!glossary.length) return s
          let out = String(s || '')
          for (const term of glossary) {
            const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
            out = out.replace(re, (m) => `<keep>${m}</keep>`)
          }
          return out
        }
        const textProtected = protect(text)
        const unwrapKeep = (s) => String(s || '').replace(/<\/?keep>/g, '')
        const pieces = chunkText(textProtected, 2500)
        if (!pieces.length) return ''
        const html = looksLikeHtml(textProtected) || glossary.length > 0
        const doRequest = async () => {
          const params = new URLSearchParams()
          for (const p of pieces) params.append('text', p)
          params.append('target_lang', 'ES')
          params.append('source_lang', 'EN')
          params.append('preserve_formatting', '1')
          if (html) params.append('tag_handling', 'html')
          if (glossary.length) params.append('ignore_tags', 'keep')
          const r = await fetch(`${base}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `DeepL-Auth-Key ${key}` },
            body: params
          })
          const j = await r.json().catch(async () => ({}))
          if (!r.ok || !Array.isArray(j?.translations)) return null
          const arr = j.translations
          const out = []
          for (let i = 0; i < pieces.length; i++) {
            const t = String(arr?.[i]?.text || '')
            out.push(unwrapKeep(t || pieces[i]))
          }
          const textOut = out.join('')
          if (textOut) providersUsed.add('deepl')
          return textOut
        }
        for (let attempt = 0; attempt < 3; attempt++) {
          const res = await doRequest()
          if (res) return res
          await new Promise(r => setTimeout(r, 400 * (attempt + 1)))
        }
        // last resort: per-piece sequential to salvage as much as possible
        const out = []
        for (const p of pieces) {
          try {
            const params = new URLSearchParams()
            params.append('text', p)
            params.append('target_lang', 'ES')
            params.append('source_lang', 'EN')
            params.append('preserve_formatting', '1')
            if (html) params.append('tag_handling', 'html')
            const r = await fetch(`${base}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `DeepL-Auth-Key ${key}` },
              body: params
            })
            const j = await r.json().catch(async () => ({}))
            const t = String(j?.translations?.[0]?.text || '')
            out.push(unwrapKeep(t || p))
          } catch { out.push(p) }
        }
        const textOut = out.join('')
        if (textOut) providersUsed.add('deepl')
        return textOut
      }
      const translateSmart = async (text) => {
        const pref = String(process.env.TRANSLATE_PRIMARY || '').toLowerCase()
        const order = pref === 'deepl' ? [translateWithDeepL, translateWithAzure, fallbackTranslate]
          : (pref === 'azure' ? [translateWithAzure, translateWithDeepL, fallbackTranslate] : [translateWithAzure, translateWithDeepL, fallbackTranslate])
        for (const fn of order) {
          const es = await fn(text)
          if (es) return es
        }
        return ''
      }
      const getProviderLabel = (primaryPref) => {
        if (providersUsed.has('deepl')) return 'deepl'
        if (providersUsed.has('azure')) return 'azure'
        if (providersUsed.has('libre')) return 'libre'
        if (providersUsed.has('mymemory')) return 'mymemory'
        return primaryPref || undefined
      }
      const extractFromPrompt = (p) => {
        const s = String(p || '')
        const a = s.indexOf('English Title:')
        const b = s.indexOf('English Excerpt:')
        const c = s.indexOf('English Body:')
        const end = s.lastIndexOf('Respond with JSON only.')
        const e = end >= 0 ? end : s.length
        const title = a >= 0 && b > a ? s.slice(a + 'English Title:'.length, b).trim() : ''
        const excerpt = b >= 0 && c > b ? s.slice(b + 'English Excerpt:'.length, c).trim() : ''
        const body = c >= 0 ? s.slice(c + 'English Body:'.length, e).trim() : ''
        return { title, excerpt, body }
      }

      // Primary-direct path when configured
      const primaryPref = String(process.env.TRANSLATE_PRIMARY || '').toLowerCase()
      if (primaryPref === 'deepl' || primaryPref === 'azure') {
        try {
          const { title, excerpt, body } = extractFromPrompt(userPrompt)
          const [tEs, eEs, bEs] = await Promise.all([
            translateSmart(title),
            translateSmart(excerpt),
            translateSmart(body)
          ])
          const payload = JSON.stringify({ title: tEs, excerpt: eEs, body: bEs, metaTitle: tEs, metaDescription: eEs })
          const prov = getProviderLabel(primaryPref)
          return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: payload, toolCalls: [], provider: prov }) }
        } catch {}
      }
      // Try Responses API first across candidates
      for (const m of models) {
        try {
          const r = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers,
            body: JSON.stringify({ model: m, input: inputText, temperature: temp, max_output_tokens: maxOut, response_format: { type: 'json_object' } })
          })
          const j = await r.json().catch(async () => ({ error: { message: await r.text().catch(()=> 'Upstream error') } }))
          if (r.ok) {
            const content = String(j?.output_text || '').trim()
            if (content) return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, toolCalls: [] }) }
          } else {
            const msg = (j?.error?.message || '').toLowerCase()
            if (r.status === 401 || msg.includes('invalid_api_key')) {
              // OpenAI unavailable for this key — perform fallback
              const { title, excerpt, body } = extractFromPrompt(userPrompt)
              const [tEs, eEs, bEs] = await Promise.all([
                translateSmart(title),
                translateSmart(excerpt),
                translateSmart(body)
              ])
              const payload = JSON.stringify({ title: tEs, excerpt: eEs, body: bEs, metaTitle: tEs, metaDescription: eEs })
              const prov = getProviderLabel(primaryPref)
              return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: payload, toolCalls: [], provider: prov }) }
            }
            // try next model on 400/404
          }
        } catch {}
      }

      // Fallback to Chat Completions
      const messages = [{ role: 'system', content: sysText }, { role: 'user', content: userPrompt }]
      for (const m of models) {
        try {
          const r1 = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST', headers, body: JSON.stringify({ model: m, messages, temperature: temp, max_tokens: maxOut, response_format: { type: 'json_object' } })
          })
          const j1 = await r1.json().catch(async () => ({ error: { message: await r1.text().catch(()=> 'Upstream error') } }))
          if (r1.ok) {
            const content = String(j1?.choices?.[0]?.message?.content || '').trim()
            if (content) return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, toolCalls: [] }) }
          } else {
            const msg = (j1?.error?.message || '').toLowerCase()
            if (r1.status === 401 || msg.includes('invalid_api_key')) {
              const { title, excerpt, body } = extractFromPrompt(userPrompt)
              const [tEs, eEs, bEs] = await Promise.all([
                translateSmart(title),
                translateSmart(excerpt),
                translateSmart(body)
              ])
              const payload = JSON.stringify({ title: tEs, excerpt: eEs, body: bEs, metaTitle: tEs, metaDescription: eEs })
              return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: payload, toolCalls: [] }) }
            }
            // Retry without response_format if not supported
            if (msg.includes('response_format') || msg.includes('json_object')) {
              const r2 = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST', headers, body: JSON.stringify({ model: m, messages, temperature: temp, max_tokens: maxOut })
              })
              const j2 = await r2.json().catch(async () => ({ error: { message: await r2.text().catch(()=> 'Upstream error') } }))
              if (r2.ok) {
                const content = String(j2?.choices?.[0]?.message?.content || '').trim()
                if (content) return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, toolCalls: [] }) }
              } else if (r2.status === 401) {
                const { title, excerpt, body } = extractFromPrompt(userPrompt)
                const [tEs, eEs, bEs] = await Promise.all([
                  translateSmart(title),
                  translateSmart(excerpt),
                  translateSmart(body)
                ])
                const payload = JSON.stringify({ title: tEs, excerpt: eEs, body: bEs, metaTitle: tEs, metaDescription: eEs })
                const prov = getProviderLabel(primaryPref)
                return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: payload, toolCalls: [], provider: prov }) }
              }
            }
          }
        } catch {}
      }
      // Final fallback if all else failed (non-401)
      try {
        const { title, excerpt, body } = extractFromPrompt(userPrompt)
        const [tEs, eEs, bEs] = await Promise.all([
          translateSmart(title),
          translateSmart(excerpt),
          translateSmart(body)
        ])
        const payload = JSON.stringify({ title: tEs, excerpt: eEs, body: bEs, metaTitle: tEs, metaDescription: eEs })
        const prov = getProviderLabel(primaryPref)
        return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: payload, toolCalls: [], provider: prov }) }
      } catch {
        return { statusCode: 500, headers: cors, body: 'Upstream error' }
      }
    }
    // Time budget for upstream calls (ms)
    const started = Date.now()
    const BUDGET_MS = Number(process.env.COPILOT_BUDGET_MS || 9000)
    const budgetLeft = () => Math.max(0, BUDGET_MS - (Date.now() - started))
    const textFromHtml = (html = '') => {
      try {
        let s = String(html)
        s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ')
        s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ')
        const title = (s.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim()
        s = s.replace(/<[^>]+>/g, ' ')
        s = s.replace(/\s+/g, ' ').trim()
        if (s.length > 16000) s = s.slice(0, 16000)
        return { title, text: s }
      } catch { return { title: '', text: '' } }
    }

    // Helper: fetch with timeout
    const fetchWithTimeout = async (url, options = {}, ms = 8000) => {
      const ctrl = new AbortController()
      const id = setTimeout(() => ctrl.abort(), ms)
      try {
        const r = await fetch(url, { ...options, signal: ctrl.signal })
        return r
      } finally { clearTimeout(id) }
    }

    const runServerTool = async (name, args) => {
      if (name === 'fetchUrl') {
        const url = String(args?.url || '')
        if (!/^https?:\/\//i.test(url)) return { error: 'INVALID_URL' }
        try {
          const r = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0 GOLDLAW-Copilot' } }, Math.min(7000, budgetLeft()))
          const ct = r.headers.get('content-type') || ''
          if (!ct.includes('text/html')) {
            const text = await r.text().catch(()=> '')
            return { url, title: '', text: text.slice(0, 8000) }
          }
          const html = await r.text()
          const { title, text } = textFromHtml(html)
          return { url, title, text }
        } catch { return { error: 'FETCH_FAILED', url } }
      }
      if (name === 'searchWeb') {
        const query = String(args?.query || '')
        const maxResults = Number(args?.maxResults || 5)
        const key = process.env.TAVILY_API_KEY || ''
        if (!key) return { error: 'SEARCH_UNAVAILABLE', results: [] }
        try {
          const r = await fetchWithTimeout('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: key, query, max_results: Math.min(8, Math.max(1, maxResults)), include_answer: false, include_raw_content: false })
          }, Math.min(7000, budgetLeft()))
          const data = await r.json().catch(()=>({}))
          const results = Array.isArray(data?.results) ? data.results.map(x => ({ title: x.title, url: x.url, snippet: x.content })) : []
          return { query, results }
        } catch { return { error: 'SEARCH_FAILED', results: [] } }
      }
      return { note: 'CLIENT_TOOL', name, args }
    }

    // Prefetch user-provided URLs (from the last user message) and inject as authoritative context
    const lastUser = incoming[incoming.length - 1] || {}
    const urlMatches = String(lastUser.content || '').match(/https?:\/\/[^\s)"'<>]+/g) || []
    const uniqueUrls = Array.from(new Set(urlMatches)).slice(0, 2)
    const fetchedSources = await Promise.all(uniqueUrls.map(async (u) => {
      const out = await runServerTool('fetchUrl', { url: u })
      return { url: u, title: out?.title || '', text: out?.text || '' }
    }))
    // Build conversation with long-form and creation intent hints
    let convo = [sys]
    const lastUserText = String(lastUser.content || '')
    const articleLike = looksLikeArticlePrompt(lastUserText)
    if (articleLike) {
      const longFormMsg = {
        role: 'system',
        content: [
          'User is requesting a comprehensive long-form legal article, similar to a practice-area landing page, not a short news blurb.',
          'Respond with a structured article as described: multiple H2/H3 sections, practical timelines and steps, explanation of the law and its impact, how a West Palm Beach GOLDLAW lawyer can help, several concise "Pro Tip" callouts, a short FAQ, and a strong localized call-to-action at the end.',
          'Write complete prose — do not use placeholders like "Change 1: …" or "…". Target approximately 1200–1800 words. Keep it specific to the user’s topic and jurisdiction if provided.',
        ].join(' '),
      }
      convo.push(longFormMsg)
    }
    const clearlyCreate = /\b(create|draft|write|generate|develop)\b[\s\S]{0,80}\b(article|post|blog|guide|landing\s*page)\b/i.test(lastUserText)
    const wantsCitations = /\b(cite|citation|citations|sources?)\b/i.test(lastUserText) || /\b\d+\s+(sources?|citations?)\b/i.test(lastUserText)
    if (clearlyCreate) {
      const forceCreateMsg = {
        role: 'system',
        content: [
          'User explicitly asked to create a new article. You must call createArticle with full fields: { title, excerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl, status }.',
          'The body must be fully written (no placeholders like "…"), specific to the prompt, and long-form (roughly 1200–1800 words).',
          'Infer reasonable defaults where missing. Do not ask the user to draft manually; proceed to create the article now.'
        ].join(' ')
      }
      convo.push(forceCreateMsg)
    }
    if (wantsCitations) {
      const citeMsg = {
        role: 'system',
        content: 'User requested cited sources. Use searchWeb (3–5 reputable results) and/or provided URLs, quote accurately, and include a final Sources section with bullet links. Cite inline where helpful.'
      }
      convo.push(citeMsg)
    }
    // If the user asked for citations and we have time and a search provider, pre-search to ground the draft
    let searchedResults = []
    if (wantsCitations && budgetLeft() > 800) {
      try {
        const queryText = (lastUserText || '').slice(0, 240)
        const out = await runServerTool('searchWeb', { query: queryText, maxResults: 5 })
        if (Array.isArray(out?.results)) searchedResults = out.results.slice(0, 5)
      } catch {}
    }
    if (fetchedSources.length) {
      const bullets = fetchedSources.map((s, i) => `${i + 1}. ${s.title || '(untitled)'} — ${s.url}`).join('\n')
      const snippets = fetchedSources.map((s, i) => `SOURCE ${i + 1} (${s.url})\nTitle: ${s.title || '(untitled)'}\nExcerpt: ${(s.text || '').slice(0, 1200)}`).join('\n\n')
      const srcMsg = [
        'User provided the following source URL(s). Treat them as primary and stay strictly on-topic with them. Cite them under a Sources section:',
        bullets,
        'Summaries (for your reference):',
        snippets,
        'If a source seems irrelevant to the request, ask for clarification instead of inventing content.'
      ].join('\n\n')
      convo.push({ role: 'system', content: srcMsg })
    }
    if (Array.isArray(searchedResults) && searchedResults.length) {
      const bullets = searchedResults.map((r, i) => `${i + 1}. ${r.title || '(untitled)'} — ${r.url}`).join('\n')
      const snippets = searchedResults.map((r, i) => `RESULT ${i + 1} (${r.url})\nTitle: ${r.title || '(untitled)'}\nSnippet: ${(r.snippet || '').slice(0, 400)}`).join('\n\n')
      const citeMsg = [
        'High-level web results to ground your draft. Prefer reputable, authoritative sources and reflect them accurately. Include them under a final Sources section with bullet links.',
        bullets,
        'Snippets (for your reference):',
        snippets
      ].join('\n\n')
      convo.push({ role: 'system', content: citeMsg })
    }
    convo = [...convo, ...incoming.map(m => ({ role: m.role, content: String(m.content || '') }))]
    let clientCalls = []
    let finalContent = ''
    const chatTemperature = articleLike ? Math.min(0.5, temperature) : temperature
    const chatMaxTokens = articleLike ? Math.max(max_tokens, 2200) : max_tokens
    const steps = (wantsCitations || uniqueUrls.length > 0) ? 2 : 1
    for (let step = 0; step < steps; step++) {
      const forceCreateThisStep = clearlyCreate && (step === steps - 1)
      const toolChoice = forceCreateThisStep ? { type: 'function', function: { name: 'createArticle' } } : 'auto'
      if (budgetLeft() < 1500) break
      const resp = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: convo, temperature: chatTemperature, max_tokens: chatMaxTokens, tools, tool_choice: toolChoice })
      }, Math.min(9000, budgetLeft()))
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        // Upstream error: proceed to fallback stages instead of returning 500
        break
      }
      const assistantMsg = data?.choices?.[0]?.message || {}
      finalContent = (assistantMsg?.content?.trim?.() || finalContent)
      const tcs = Array.isArray(assistantMsg?.tool_calls) ? assistantMsg.tool_calls : []
      if (!tcs.length) { convo = [...convo, { role: 'assistant', content: assistantMsg.content || '' }]; continue }
      const toolOutputs = []
      for (const tc of tcs) {
        const name = tc?.function?.name || ''
        let args = {}
        try { args = JSON.parse(tc?.function?.arguments || '{}') } catch {}
        if (name === 'fetchUrl' || name === 'searchWeb') {
          const out = await runServerTool(name, args)
          toolOutputs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(out) })
        } else {
          clientCalls.push({ name, args })
          toolOutputs.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ ok: true }) })
        }
      }
      convo = [...convo, { role: 'assistant', content: assistantMsg.content || '', tool_calls: tcs }, ...toolOutputs]
    }
    // If we already have substantive assistant prose and clear create intent, synthesize createArticle before fallbacks
    if (clientCalls.length === 0 && clearlyCreate) {
      const prose = String(finalContent || '').trim()
      if (prose.length > 600) {
        let title = (prose.match(/^#\s+(.+)$/m)?.[1] || '').trim()
        if (!title) {
          const t = String(lastUserText || '').replace(/^\s*(create|draft|write|generate|develop)\s+(an?\s+)?(article|post|blog|guide|landing\s*page)\s+(on|about)\s*/i, '').trim()
          title = t || 'New Article'
        }
        clientCalls = [{ name: 'createArticle', args: { title, body: prose, status: 'draft' } }]
      }
    }
    // Second-pass fallback: if the user clearly asked to create and the model did not emit client tool calls,
    // ask for a JSON-only article draft and synthesize a createArticle tool call.
    if (clientCalls.length === 0 && clearlyCreate) {
      try {
        const jsonOnlyHint = {
          role: 'system',
          content: 'Return JSON ONLY with keys: title, excerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl. No prose, no code fences.'
        }
        if (budgetLeft() > 800) {
          const r2 = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [...convo, jsonOnlyHint], temperature: Math.min(0.6, chatTemperature), max_tokens: Math.min(chatMaxTokens, 1600), response_format: { type: 'json_object' } })
          }, Math.min(8000, budgetLeft()))
          const j2 = await r2.json().catch(() => ({ }))
          const content2 = String(j2?.choices?.[0]?.message?.content || '').trim()
          if (r2.ok && content2) {
            try {
              const parsed = JSON.parse(content2)
              const title = String(parsed?.title || '').trim()
              const bodyText = String(parsed?.body || '').trim()
              if (title && bodyText) {
                const args = {
                  title,
                  excerpt: String(parsed?.excerpt || ''),
                  body: bodyText,
                  tags: Array.isArray(parsed?.tags) ? parsed.tags.slice(0, 8).map((t) => String(t)) : [],
                  keyphrase: parsed?.keyphrase ? String(parsed.keyphrase) : undefined,
                  metaTitle: parsed?.metaTitle ? String(parsed.metaTitle) : undefined,
                  metaDescription: parsed?.metaDescription ? String(parsed.metaDescription) : undefined,
                  canonicalUrl: parsed?.canonicalUrl ? String(parsed.canonicalUrl) : undefined,
                  status: 'draft'
                }
                clientCalls = [{ name: 'createArticle', args }]
              }
            } catch {}
          }
        }
      } catch {}
      // Third-stage: if still no tool calls, ask for a full Markdown article and synthesize createArticle
      if (clientCalls.length === 0 && articleLike && budgetLeft() > 800) {
        try {
          const articleHint = {
            role: 'system',
            content: 'Draft a comprehensive long-form legal article in Markdown with a single H1 title line, multiple H2/H3 sections (Key Changes, Timeline, How a Lawyer Helps, Hidden Issues, FAQ, Pro Tips), and a strong localized GOLDLAW call-to-action. Do not include any meta notes; output article content only.'
          }
          const r3 = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [...convo, articleHint], temperature: Math.min(0.7, chatTemperature), max_tokens: Math.min(chatMaxTokens, 2000), tool_choice: 'none' })
          }, Math.min(8000, budgetLeft()))
          const j3 = await r3.json().catch(()=>({}))
          const content3 = String(j3?.choices?.[0]?.message?.content || '').trim()
          if (r3.ok && content3) {
            let title3 = (content3.match(/^#\s+(.+)$/m)?.[1] || '').trim()
            if (!title3) {
              const t = String(lastUserText || '').replace(/^\s*(create|draft|write|generate|develop)\s+(an?\s+)?(article|post|blog)\s+(on|about)\s*/i, '').trim()
              title3 = t || 'New Article'
            }
            clientCalls = [{ name: 'createArticle', args: { title: title3, body: content3, status: 'draft' } }]
          }
        } catch {}
      }
      // Final local synthesis if upstream fallbacks could not run
      if (clientCalls.length === 0 && clearlyCreate) {
        try {
          let synthTitle = (String(lastUserText || '').replace(/^\s*(create|draft|write|generate|develop)\s+(an?\s+)?(article|post|blog)\s+(on|about)\s*/i, '').trim()) || 'New Article'
          const kp = synthTitle.toLowerCase().replace(/[^a-z0-9\s]+/g, ' ').trim()
          const city = 'West Palm Beach'
          const keyphraseUse = kp || 'personal injury law'
          const srcList = (Array.isArray(fetchedSources) && fetchedSources.length)
            ? ('\n\n## Sources\n' + fetchedSources.map((s) => `- [${s.title || s.url}](${s.url})`).join('\n'))
            : ''
          const proTips = [
            'Document medical care, expenses, and missed work.',
            'Avoid detailed statements to insurers before consulting an attorney.',
            'Consult an attorney early to preserve evidence and meet deadlines.'
          ]
          const tipsMd = proTips.map(t => `- ${t}`).join('\n')
          const cta = `If you or someone you know has been a victim of ${keyphraseUse}, you are not alone — and you are not without options. Contact GOLDLAW today for a confidential consultation. We will listen, guide you through your rights, and fight for accountability.`
          const body = [
            `# ${synthTitle}`,
            '',
            '## Key Changes in the Law',
            `Florida recently updated key rules affecting ${keyphraseUse}. These changes alter timelines, proof requirements, and how claims are handled. Below is a practical breakdown focused on what victims and families in ${city} should know and do next.`,
            '',
            '### Change 1',
            `Explain the change and why it matters for ${keyphraseUse} cases in ${city}. Give concrete, plain-English examples that show how the rule impacts deadlines, evidence collection, and insurance negotiations.`,
            '',
            '### Change 2',
            'Explain the change with practical examples. Note how it affects medical treatment coordination, claim valuation, and common pitfalls that could reduce compensation.',
            '',
            '## Timeline of Actions for Victims',
            'A structured checklist helps you act quickly and avoid missing critical deadlines.',
            '',
            '1. Immediately After the Accident',
            'Get medical care, report the incident, and preserve evidence (photos, witnesses, scene details). Keep all paperwork and receipts.',
            '',
            '2. Within the First Week',
            'Notify insurers and request claim numbers. Follow medical advice and track symptoms. Avoid broad recorded statements without legal guidance.',
            '',
            '3. Within the First Month',
            'Consult a lawyer to evaluate liability, damages, and insurance coverage. Your attorney can send preservation letters and begin negotiations.',
            '',
            '4. Before the Two-Year Deadline',
            'Florida’s statute of limitations in many negligence cases is two years. Do not wait. Filing late can bar recovery entirely.',
            '',
            `## How a ${city} Lawyer Can Help`,
            'A local attorney levels the playing field with insurers and defendants.',
            '',
            '- Investigation and evidence preservation',
            '- Negotiation with insurers',
            '- Filing and litigation within deadlines',
            '',
            '## Hidden and Advanced Issues',
            '- Modified comparative negligence: recovery can be reduced or barred based on fault percentages.',
            '- Exceptions and tolling scenarios: minors, late discovery, and out-of-state defendants can affect timing.',
            '',
            '## Frequently Asked Questions',
            '**What happens if I miss the deadline?** Your claim may be dismissed. Speak to a lawyer immediately to evaluate any limited exceptions.',
            '',
            '**Can I file if I was partially at fault?** Often yes, but recovery may be reduced. Get advice before speaking with insurers.',
            '',
            '**What if I am still treating when the deadline approaches?** Filing preserves your rights while treatment continues.',
            '',
            '## Pro Tips',
            `${tipsMd}`,
            '',
            cta,
            srcList
          ].join('\n')
          const tags = keyphraseUse ? keyphraseUse.split(/\s+/).filter(Boolean).slice(0, 5) : []
          const metaTitle = `${synthTitle} — GOLDLAW`
          const metaDescription = `What changed, timelines, pitfalls, and how a ${city} lawyer helps in ${synthTitle}.`
          clientCalls = [{ name: 'createArticle', args: { title: synthTitle, body, tags, keyphrase: keyphraseUse, metaTitle, metaDescription, status: 'draft' } }]
        } catch {}
      }
    }
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: finalContent, toolCalls: clientCalls }) }
  } catch (e) {
    try { console.error('Copilot handler error:', e && (e.stack || e.message || e)) } catch {}
    const msg = (e && (e.message || (typeof e === 'string' ? e : 'Request failed'))) || 'Request failed'
    return { statusCode: 500, headers: cors, body: String(msg) }
  }
}
