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
      'You may call tools when appropriate: createTask, navigate, call, map.',
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
    { type: 'function', function: { name: 'map', description: 'Open map for an office.', parameters: { type: 'object', properties: { office: { type: 'string', enum: ['wpb','psl'] } }, required: ['office'] } } }
  ]

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens, tools, tool_choice: 'auto' })
    })
    const data = await resp.json()
    if (!resp.ok) {
      const msg = data?.error?.message || 'Upstream error'
      return { statusCode: 500, headers: cors, body: msg }
    }
    const msg = data?.choices?.[0]?.message || {}
    const content = msg?.content?.trim?.() || ''
    const rawCalls = Array.isArray(msg?.tool_calls) ? msg.tool_calls : []
    const toolCalls = rawCalls.map((tc) => {
      let args = {}
      try { args = JSON.parse(tc?.function?.arguments || '{}') } catch {}
      return { name: tc?.function?.name || '', args }
    })
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content, toolCalls }) }
  } catch (e) {
    return { statusCode: 500, headers: cors, body: 'Request failed' }
  }
}
