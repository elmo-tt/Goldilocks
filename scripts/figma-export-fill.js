import fs from 'node:fs'
import fsp from 'node:fs/promises'
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

function collectImageRefs(node, out) {
  if (!node) return
  const check = (paints) => {
    if (Array.isArray(paints)) {
      for (const p of paints) {
        if (p?.type === 'IMAGE' && p?.imageRef) out.add(p.imageRef)
      }
    }
  }
  check(node.fills)
  check(node.strokes)
  check(node.background)
  if (Array.isArray(node.children)) {
    for (const c of node.children) collectImageRefs(c, out)
  }
}

async function download(url, outFile) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fsp.mkdir(path.dirname(outFile), { recursive: true })
  await fsp.writeFile(outFile, buf)
}

async function main() {
  const id = arg('id')
  const name = arg('name', 'hero-bg.png')
  if (!id) {
    console.error('Usage: npm run figma:export-fill -- --id <nodeId> [--name hero-bg.png]')
    process.exit(1)
  }
  const data = await getJSON(`${apiBase}/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(id)}`)
  const node = data.nodes?.[id]?.document
  if (!node) {
    console.error('Unable to load node', id)
    process.exit(1)
  }
  const refs = new Set()
  collectImageRefs(node, refs)
  const list = Array.from(refs)
  if (list.length === 0) {
    console.error('No image fills found under node', id)
    process.exit(1)
  }
  // Use the largest image first (Figma doesn't give sizes here, so just pick first)
  const hash = list[0]
  const j = await getJSON(`${apiBase}/files/${FILE_KEY}/images?ids=${encodeURIComponent(hash)}`)
  const url = j.images?.[hash]
  if (!url) {
    console.error('No URL for hash', hash)
    process.exit(1)
  }
  const outPath = path.resolve('public', 'figma', name)
  await download(url, outPath)
  console.log('Exported image fill', hash, '->', path.relative(process.cwd(), outPath))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
