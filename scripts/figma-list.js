import fs from 'node:fs'
import path from 'node:path'
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

function sanitize(name) {
  return String(name).trim().replace(/\s+/g, ' ')
}

async function getJSON(url) {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} for ${url}: ${text}`)
  }
  return res.json()
}

function traverse(node, pageName, out) {
  if (!node) return
  if (node.type === 'FRAME') {
    const bb = node.absoluteBoundingBox || {}
    out.push({
      id: node.id,
      page: pageName,
      name: sanitize(node.name || ''),
      width: bb.width || 0,
      height: bb.height || 0,
    })
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) traverse(c, pageName, out)
  }
}

async function main() {
  const data = await getJSON(`${apiBase}/files/${FILE_KEY}`)
  const pages = data.document?.children || []
  const frames = []
  for (const p of pages) {
    traverse(p, p.name, frames)
  }
  frames.sort((a, b) => (b.width * b.height) - (a.width * a.height))

  console.log('Frames (largest first):')
  for (const f of frames.slice(0, 50)) {
    console.log(`- [${f.page}] ${f.name}  (${Math.round(f.width)}×${Math.round(f.height)})  id=${f.id}`)
  }

  const desktop = frames.find(f => f.width >= 1180 && f.height >= 600) || frames[0]
  if (desktop) {
    console.log(`\nSuggested primary frame: [${desktop.page}] ${desktop.name} (${Math.round(desktop.width)}×${Math.round(desktop.height)}) id=${desktop.id}`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
