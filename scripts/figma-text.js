import fs from 'node:fs'
import fetch from 'node-fetch'
import dotenv from 'dotenv'

const envPath = fs.existsSync('.env.local') ? '.env.local' : (fs.existsSync('.env') ? '.env' : undefined)
dotenv.config(envPath ? { path: envPath } : {})

const TOKEN = process.env.FIGMA_TOKEN
const FILE_KEY = process.env.FIGMA_FILE_KEY

if (!TOKEN || !FILE_KEY) {
  console.error('Missing FIGMA_TOKEN or FIGMA_FILE_KEY in environment. Create a .env (or .env.local) with these values.')
  process.exit(1)
}

const apiBase = 'https://api.figma.com/v1'
const headers = {
  'X-Figma-Token': TOKEN,
}

function arg(name, def) {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1]
  return def
}

async function getJSON(url) {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} for ${url}: ${text}`)
  }
  return res.json()
}

function collectText(node, out) {
  if (!node) return
  if (node.type === 'TEXT') {
    const bb = node.absoluteBoundingBox || {}
    const text = (node.characters || '').replace(/\s+/g, ' ').trim()
    if (text) out.push({ y: bb.y || 0, x: bb.x || 0, size: node.style?.fontSize || 0, weight: node.style?.fontWeight || 0, text })
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) collectText(c, out)
  }
}

async function main() {
  const id = arg('id')
  if (!id) {
    console.error('Usage: npm run figma:text -- --id <nodeId>')
    process.exit(1)
  }
  const data = await getJSON(`${apiBase}/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(id)}`)
  const node = data.nodes?.[id]?.document
  if (!node) {
    console.error('Unable to load node', id)
    process.exit(1)
  }
  const texts = []
  collectText(node, texts)
  texts.sort((a, b) => a.y - b.y || a.x - b.x)
  console.log(`Found ${texts.length} text entries in node ${id}:`)
  for (const t of texts) {
    console.log(`- (${Math.round(t.size)}px, w${t.weight}) ${t.text}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
