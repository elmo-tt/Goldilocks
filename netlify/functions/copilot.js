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
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { statusCode: 500, headers: cors, body: 'Missing OPENAI_API_KEY' }
  }
  let body
  try { body = JSON.parse(event.body || '{}') } catch { body = {} }
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
      'When asked to write an article from web sources: (1) use fetchUrl for any provided URL, (2) optionally use searchWeb (3–5 results), (3) present a brief "Sources" list as bullets with links, (4) present a short excerpt and a structured article body with headings, (5) call createArticle with { title, excerpt, body, tags, keyphrase, metaTitle, metaDescription, canonicalUrl, status }. Keep metaTitle ~60 chars, metaDescription ~155 chars. Tags should be 1–5 short topic labels.',
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
          anyOf: [ { required: ['id'] }, { required: ['slug'] } ]
        }
      }
    }
  ]

  try {
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

    let convo = [...messages]
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
