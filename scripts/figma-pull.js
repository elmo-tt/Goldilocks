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

function sanitize(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
}

function toHex(n) {
  const clamped = Math.max(0, Math.min(255, Math.round(n)))
  return clamped.toString(16).padStart(2, '0')
}

function rgbaToHex(color, opacity = 1) {
  if (!color) return null
  const r = toHex((color.r ?? 0) * 255)
  const g = toHex((color.g ?? 0) * 255)
  const b = toHex((color.b ?? 0) * 255)
  const a = opacity < 1 ? toHex(opacity * 255) : ''
  return `#${r}${g}${b}${a}`
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  if (h.length !== 6 && h.length !== 8) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return { r, g, b }
}

function relativeLuminance({ r, g, b }) {
  // sRGB to linear
  const srgb = [r, g, b].map(v => v / 255)
  const lin = srgb.map(v => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

async function getJSON(url) {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status} for ${url}: ${text}`)
  }
  return res.json()
}

async function pullVariables() {
  try {
    const data = await getJSON(`${apiBase}/files/${FILE_KEY}/variables`)
    const collectionsById = Object.fromEntries((data.meta?.variableCollections ?? []).map(c => [c.id, c]))
    const variables = data.meta?.variables ?? []

    const lines = []

    for (const v of variables) {
      const collection = collectionsById[v.variableCollectionId]
      const defaultMode = collection?.modes?.[0]?.modeId
      const value = (v.valuesByMode && defaultMode) ? v.valuesByMode[defaultMode] : undefined
      if (value == null) continue

      const prefix = (v.resolvedType || v.type || '').toLowerCase() || 'var'
      const name = `--${prefix}-${sanitize(v.name)}`

      if ((v.resolvedType || v.type) === 'COLOR' && value) {
        const hex = rgbaToHex(value, value.a ?? 1)
        if (hex) lines.push(`  ${name}: ${hex};`)
      } else if ((v.resolvedType || v.type) === 'FLOAT') {
        lines.push(`  ${name}: ${value};`)
      }
      // Other variable types (STRING, BOOLEAN) are ignored for CSS
    }

    return lines
  } catch (err) {
    // Variables may not be available; proceed silently
    return []
  }
}

async function pullStyles() {
  const meta = await getJSON(`${apiBase}/files/${FILE_KEY}/styles`)
  const styles = meta.meta?.styles ?? []
  const fillStyles = styles.filter(s => s.style_type === 'FILL')
  const textStyles = styles.filter(s => s.style_type === 'TEXT')

  const nodeIds = [...new Set([...fillStyles, ...textStyles].map(s => s.node_id))]

  const chunks = []
  const chunkSize = 100
  for (let i = 0; i < nodeIds.length; i += chunkSize) {
    chunks.push(nodeIds.slice(i, i + chunkSize))
  }

  const nodes = {}
  for (const ids of chunks) {
    const data = await getJSON(`${apiBase}/files/${FILE_KEY}/nodes?ids=${encodeURIComponent(ids.join(','))}`)
    Object.assign(nodes, data.nodes)
  }

  const lines = []

  // Colors from paint styles
  for (const s of fillStyles) {
    const nodeWrap = nodes[s.node_id]
    const node = nodeWrap?.document
    if (!node) continue
    const paints = node.paints || node.fills || []
    const solid = (paints || []).find(p => p?.type === 'SOLID' && (p.visible ?? true))
    if (!solid || !solid.color) continue
    const hex = rgbaToHex(solid.color, solid.opacity ?? 1)
    if (!hex) continue
    const name = `--color-${sanitize(s.name)}`
    lines.push(`  ${name}: ${hex};`)
  }

  // Typography from text styles
  for (const s of textStyles) {
    const nodeWrap = nodes[s.node_id]
    const node = nodeWrap?.document
    if (!node) continue
    const st = node.style || {}
    const base = sanitize(s.name)

    if (st.fontFamily) lines.push(`  --font-family-${base}: ${JSON.stringify(st.fontFamily)};`)
    if (st.fontSize) lines.push(`  --font-size-${base}: ${st.fontSize}px;`)

    let lh = 'normal'
    if (typeof st.lineHeightPx === 'number') {
      lh = `${Math.round(st.lineHeightPx)}px`
    } else if (typeof st.lineHeightPercentFontSize === 'number') {
      lh = `${(st.lineHeightPercentFontSize / 100).toFixed(2)}em`
    }
    lines.push(`  --line-height-${base}: ${lh};`)

    if (typeof st.letterSpacing === 'number') {
      lines.push(`  --letter-spacing-${base}: ${st.letterSpacing}px;`)
    } else if (typeof st.letterSpacingPercent === 'number') {
      lines.push(`  --letter-spacing-${base}: ${(st.letterSpacingPercent / 100).toFixed(3)}em;`)
    }

    if (typeof st.fontWeight === 'number') {
      lines.push(`  --font-weight-${base}: ${st.fontWeight};`)
    }
  }

  return lines
}

async function pullFileAndInfer() {
  // Traverse full file for colors and text styles
  const data = await getJSON(`${apiBase}/files/${FILE_KEY}`)
  const document = data.document
  const colorCounts = new Map() // hex -> count
  const textEntries = [] // {fontFamily, fontSize, fontWeight, lineHeight}

  function addColor(hex) {
    if (!hex) return
    const key = hex.toLowerCase()
    colorCounts.set(key, (colorCounts.get(key) || 0) + 1)
  }

  function traverse(node) {
    if (!node || node.visible === false) return
    const fills = node.fills || node.paints
    if (Array.isArray(fills)) {
      for (const f of fills) {
        if (f?.type === 'SOLID' && (f.visible ?? true)) {
          addColor(rgbaToHex(f.color, f.opacity ?? 1))
        }
      }
    }
    if (node.type === 'TEXT' && node.style) {
      const st = node.style
      textEntries.push({
        fontFamily: st.fontFamily,
        fontSize: st.fontSize,
        fontWeight: st.fontWeight,
        lineHeightPx: st.lineHeightPx,
        lineHeightPercentFontSize: st.lineHeightPercentFontSize,
      })
    }
    if (Array.isArray(node.children)) {
      for (const c of node.children) traverse(c)
    }
  }

  traverse(document)

  // Build color tokens
  const colors = Array.from(colorCounts.entries()).sort((a, b) => b[1] - a[1]).map(([hex]) => hex)
  const colorLines = []
  if (colors.length) {
    // Heuristic: pick lightest as background, darkest as text
    let lightest = colors[0]
    let darkest = colors[0]
    let maxLum = -1
    let minLum = 999
    for (const hex of colors) {
      const rgb = hexToRgb(hex)
      if (!rgb) continue
      const L = relativeLuminance(rgb)
      if (L > maxLum) { maxLum = L; lightest = hex }
      if (L < minLum) { minLum = L; darkest = hex }
    }
    colorLines.push(`  --color-background: ${lightest};`)
    colorLines.push(`  --color-text: ${darkest};`)
    // Also expose top 8 colors
    colors.slice(0, 8).forEach((hex, i) => {
      const name = `--color-${i + 1}-${hex.replace('#', '')}`
      colorLines.push(`  ${name}: ${hex};`)
    })
  }

  // Build typography tokens by grouping sizes (desc) and mapping to h1..h6
  const uniqSizes = Array.from(new Set(textEntries.map(t => t.fontSize).filter(Boolean))).sort((a, b) => b - a)
  const typeLines = []
  const pickLineHeight = (t) => {
    if (typeof t.lineHeightPx === 'number') return `${Math.round(t.lineHeightPx)}px`
    if (typeof t.lineHeightPercentFontSize === 'number') return `${(t.lineHeightPercentFontSize / 100).toFixed(2)}em`
    return '1.2'
  }
  for (let i = 0; i < Math.min(6, uniqSizes.length); i++) {
    const size = uniqSizes[i]
    const candidates = textEntries.filter(t => t.fontSize === size)
    // Choose most common weight among candidates
    const weightCounts = new Map()
    for (const c of candidates) weightCounts.set(c.fontWeight, (weightCounts.get(c.fontWeight) || 0) + 1)
    const weight = Array.from(weightCounts.entries()).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] || 700
    const lh = pickLineHeight(candidates[0] || {})
    const tag = `h${i + 1}`
    typeLines.push(`  --font-size-${tag}: ${size}px;`)
    typeLines.push(`  --line-height-${tag}: ${lh};`)
    typeLines.push(`  --font-weight-${tag}: ${weight};`)
  }

  // Font family
  const fam = (textEntries.find(t => t.fontFamily)?.fontFamily) || 'Montserrat'
  typeLines.push(`  --font-family-primary: ${JSON.stringify(fam)};`)

  return [...colorLines, ...typeLines]
}
async function writeTokens(lines) {
  const outDir = path.resolve(process.cwd(), 'src', 'styles')
  await fsp.mkdir(outDir, { recursive: true })
  const file = path.join(outDir, 'tokens.css')
  const arr = lines.sort()
  const content = arr.length
    ? `/* Auto-generated from Figma. Do not edit directly. */\n:root {\n${arr.join('\n')}\n}\n`
    : ''
  await fsp.writeFile(file, content, 'utf8')
  console.log(`Wrote ${lines.length} CSS variables to ${path.relative(process.cwd(), file)}`)
}

async function main() {
  const varLines = await pullVariables()
  const styleLines = await pullStyles()
  let all = [...new Set([...varLines, ...styleLines])] // dedupe exact strings
  if (all.length === 0) {
    try {
      const inferred = await pullFileAndInfer()
      all = [...new Set([...all, ...inferred])]
    } catch (e) {
      // ignore
    }
  }
  await writeTokens(all)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
