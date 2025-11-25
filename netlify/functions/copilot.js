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
  const model = body.model || process.env.COPILOT_MODEL || 'gpt-4o-mini'
  const temperature = Number(process.env.COPILOT_TEMPERATURE ?? body.temperature ?? 0.3)
  const max_tokens = Number(process.env.COPILOT_MAX_TOKENS ?? body.max_tokens ?? 900)

  const sys = {
    role: 'system',
    content: [
      'You are the GOLDLAW Copilot. Answer concisely and helpfully.',
      'Format your responses in Markdown (GFM). Prefer short sections with headings, bullet/numbered lists, and inline links like [Title](https://...). Use bold for key labels.',
      'You may call tools when appropriate: createTask, navigate, call, map, fetchUrl, searchWeb, createArticle.',
      // Article workflow with SEO
      'When asked to write an article from web sources: (1) use fetchUrl for every provided URL in the user message (treat them as primary sources), (2) optionally use searchWeb (3–5 results) if available, (3) present a brief "Sources" list as bullets with links, (4) present a short excerpt and a structured article body with headings, (5) call createArticle with { title, excerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl, status }. Keep metaTitle ~60 chars, metaDescription ~155 chars. Tags should be 1–5 short topic labels. Stay strictly on-topic with the fetched sources; do not pivot to unrelated topics.',
      'If searchWeb is unavailable, proceed using provided fetchUrl content only and do not fabricate sources. If a provided URL fetch fails or is irrelevant, ask for another URL or clarification before drafting.',
      'When asked to modify an existing article: you MUST call updateArticle with an identifier (slug or id) plus only the fields to change. If you cannot uniquely identify the article, ask a brief clarifying question (offer 1–3 likely titles) and do not claim completion.',
      'Do NOT say "Done" unless you actually invoked a tool (e.g., updateArticle/createArticle) successfully.',
      'Ask for confirmation if a destructive or uncertain action is requested. If the user says "yes"/"proceed", go ahead and call the tool.',
      'If answering without tools, keep replies brief and actionable.'
    ].join(' ')
  }
  const messages = [sys, ...incoming.map(m => ({ role: m.role, content: String(m.content || '') }))]
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

    const runServerTool = async (name, args) => {
      if (name === 'fetchUrl') {
        const url = String(args?.url || '')
        if (!/^https?:\/\//i.test(url)) return { error: 'INVALID_URL' }
        try {
          const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 GOLDLAW-Copilot' } })
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
          const r = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ api_key: key, query, max_results: Math.min(8, Math.max(1, maxResults)), include_answer: false, include_raw_content: false })
          })
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
    const fetchedSources = []
    for (const u of uniqueUrls) {
      const out = await runServerTool('fetchUrl', { url: u })
      fetchedSources.push({ url: u, title: out?.title || '', text: out?.text || '' })
    }
    let convo = [sys]
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
    convo = [...convo, ...incoming.map(m => ({ role: m.role, content: String(m.content || '') }))]
    let clientCalls = []
    let finalContent = ''
    for (let step = 0; step < 3; step++) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages: convo, temperature, max_tokens, tools, tool_choice: 'auto' })
      })
      const data = await resp.json()
      if (!resp.ok) {
        const msg = data?.error?.message || 'Upstream error'
        return { statusCode: 500, headers: cors, body: msg }
      }
      const assistantMsg = data?.choices?.[0]?.message || {}
      finalContent = (assistantMsg?.content?.trim?.() || finalContent)
      const tcs = Array.isArray(assistantMsg?.tool_calls) ? assistantMsg.tool_calls : []
      if (!tcs.length) break
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
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: finalContent, toolCalls: clientCalls }) }
  } catch (e) {
    return { statusCode: 500, headers: cors, body: 'Request failed' }
  }
}
