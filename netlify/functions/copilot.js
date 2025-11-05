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
    content: 'You are the GOLDLAW Copilot. Answer concisely. Prefer concrete next steps. Only propose actions we support: navigate, call, map, createTask. If a question is ambiguous, ask a short clarifying question first.'
  }
  const messages = [sys, ...incoming.map(m => ({ role: m.role, content: String(m.content || '') }))]

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens })
    })
    const data = await resp.json()
    if (!resp.ok) {
      const msg = data?.error?.message || 'Upstream error'
      return { statusCode: 500, headers: cors, body: msg }
    }
    const content = data?.choices?.[0]?.message?.content?.trim?.() || ''
    return { statusCode: 200, headers: { ...cors, 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) }
  } catch (e) {
    return { statusCode: 500, headers: cors, body: 'Request failed' }
  }
}
