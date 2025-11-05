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

async function download(url, outFile) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fsp.mkdir(path.dirname(outFile), { recursive: true })
  await fsp.writeFile(outFile, buf)
}

async function main() {
  const id = arg('id')
  const name = arg('name', 'export.png')
  const scale = Number(arg('scale', '2'))
  if (!id) {
    console.error('Usage: npm run figma:export -- --id <nodeId> [--name hero.png] [--scale 2]')
    process.exit(1)
  }
  const json = await getJSON(`${apiBase}/images/${FILE_KEY}?ids=${encodeURIComponent(id)}&format=png&scale=${scale}`)
  const url = json.images?.[id]
  if (!url) {
    console.error('No image URL returned for id', id)
    process.exit(1)
  }
  const outPath = path.resolve('public', 'figma', name)
  await download(url, outPath)
  console.log('Exported', id, '->', path.relative(process.cwd(), outPath))
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
