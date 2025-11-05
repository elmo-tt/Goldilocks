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

function hasImageFill(node) {
  const fills = node.fills || node.paints
  if (!Array.isArray(fills)) return false
  return fills.some(f => f?.type === 'IMAGE' && (f.visible ?? true))
}

function traverse(node, out) {
  if (!node) return
  if (hasImageFill(node)) {
    const bb = node.absoluteBoundingBox || {}
    out.push({ id: node.id, name: node.name || '', width: Math.round(bb.width || 0), height: Math.round(bb.height || 0) })
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) traverse(c, out)
  }
}

async function main() {
  const id = arg('id')
  if (!id) {
    console.error('Usage: node scripts/figma-find-images.js --id <frameId>')
    process.exit(1)
  }
  const data = await getJSON(`${apiBase}/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(id)}`)
  const node = data.nodes?.[id]?.document
  if (!node) {
    console.error('Unable to load node', id)
    process.exit(1)
  }
  const images = []
  traverse(node, images)
  images.sort((a, b) => (b.width * b.height) - (a.width * a.height))
  console.log(`Image-like nodes under ${id} (largest first):`)
  for (const n of images.slice(0, 20)) {
    console.log(`- ${n.name}  ${n.width}x${n.height}  id=${n.id}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
