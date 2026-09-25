import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const publicDirectory = path.resolve(scriptDirectory, '../public')
const outputDirectory = path.join(publicDirectory, 'launch/instagram/lumen-introduction')

const escapeHtml = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll('\'', '&#39;')

const wrapText = (value, maxLineLength) => {
  const lines = []
  let line = ''

  for (const word of value.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word

    if (candidate.length > maxLineLength && line) {
      lines.push(line)

      line = word
    } else {
      line = candidate
    }
  }

  if (line) lines.push(line)

  return lines
}

const renderLines = (lines, options) => lines.map((line, index) => `
  <text x="${options.x}" y="${options.y + index * options.lineHeight}"
    fill="${options.fill}" font-family="Montserrat, Arial, sans-serif"
    font-size="${options.fontSize}" font-weight="${options.fontWeight}">
    ${escapeHtml(line)}
  </text>
`).join('')

const toDataUrl = async (filename, mimeType) => {
  const data = await fs.readFile(filename)

  return `data:${mimeType};base64,${data.toString('base64')}`
}

const imageToPngDataUrl = async filename => {
  const data = await sharp(filename).png().toBuffer()

  return `data:image/png;base64,${data.toString('base64')}`
}

const logoDataUrl = await toDataUrl(path.join(publicDirectory, 'logo.svg'), 'image/svg+xml')

const nativeImages = await Promise.all([
  ['React Native', 'react-native/settings-row.webp'],
  ['SwiftUI', 'apple/settings-row.webp'],
  ['Compose', 'android/settings-row.webp']
].map(async ([label, filename]) => ({
  dataUrl: await imageToPngDataUrl(path.join(publicDirectory, 'native-components', filename)),
  label
})))

const background = `
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#f8f6fd" />
      <stop offset="52%" stop-color="#eef8f6" />
      <stop offset="100%" stop-color="#fff7ed" />
    </linearGradient>
    <linearGradient id="accent" x1="0" x2="1">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="50%" stop-color="#14b8a6" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <radialGradient id="purple" cx="18%" cy="16%" r="46%">
      <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#7c3aed" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="teal" cx="88%" cy="72%" r="42%">
      <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="1080" height="1080" fill="url(#bg)" />
  <rect width="1080" height="1080" fill="url(#purple)" />
  <rect width="1080" height="1080" fill="url(#teal)" />
  <rect x="72" y="68" width="936" height="5" rx="2.5" fill="url(#accent)" />
`

const chrome = (index, label) => `
  <image href="${logoDataUrl}" x="72" y="96" width="286" height="74" />
  <text x="1008" y="140" fill="rgba(17,12,29,0.54)" text-anchor="end"
    font-family="Montserrat, Arial, sans-serif" font-size="19" font-weight="850"
    letter-spacing="2">${escapeHtml(label.toUpperCase())}</text>
  <text x="72" y="1012" fill="rgba(17,12,29,0.52)"
    font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="800">
    LUMEN.SANTI020K.COM
  </text>
  <text x="1008" y="1012" fill="rgba(17,12,29,0.52)" text-anchor="end"
    font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="800">
    ${index} / 5
  </text>
`

const card = (index, label, contents) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    ${background}
    ${chrome(index, label)}
    ${contents}
  </svg>
`

const cards = [
  card(1, 'Meet Lumen UI', `
    <rect x="72" y="280" width="128" height="6" rx="3" fill="#7c3aed" />
    ${renderLines(['Accessible UI', 'across every surface.'], {
      fill: '#110c1d', fontSize: 82, fontWeight: 900, lineHeight: 92, x: 72, y: 390
    })}
    ${renderLines(wrapText('Open-source primitives for web, native, Figma, and AI-assisted development.', 40), {
      fill: 'rgba(17,12,29,0.7)', fontSize: 34, fontWeight: 500, lineHeight: 48, x: 72, y: 650
    })}
    <rect x="72" y="846" width="456" height="66" rx="33"
      fill="rgba(124,58,237,0.12)" stroke="rgba(124,58,237,0.32)" />
    <text x="300" y="888" fill="#6d28d9" text-anchor="middle"
      font-family="Montserrat, Arial, sans-serif" font-size="22" font-weight="900"
      letter-spacing="1.5">FREE · OPEN SOURCE · MIT</text>
  `),
  card(2, 'Web', `
    <text x="72" y="326" fill="#110c1d" font-family="Montserrat, Arial, sans-serif"
      font-size="78" font-weight="900">150+ web primitives</text>
    ${renderLines(['Astro', 'React', 'Web Components'], {
      fill: '#6d28d9', fontSize: 54, fontWeight: 850, lineHeight: 82, x: 112, y: 490
    })}
    <path d="M80 454 L80 674" stroke="#14b8a6" stroke-width="7" stroke-linecap="round" />
    ${renderLines(wrapText('One semantic product language. Framework-native authoring.', 42), {
      fill: 'rgba(17,12,29,0.7)', fontSize: 34, fontWeight: 500, lineHeight: 48, x: 72, y: 800
    })}
  `),
  card(3, 'Native foundations', `
    <text x="72" y="286" fill="#110c1d" font-family="Montserrat, Arial, sans-serif"
      font-size="70" font-weight="900">Native, by convention.</text>
    <text x="72" y="344" fill="rgba(17,12,29,0.66)" font-family="Montserrat, Arial, sans-serif"
      font-size="29" font-weight="500">Shared roles without copying DOM APIs.</text>
    ${nativeImages.map(({ dataUrl, label }, imageIndex) => {
      const x = 72 + imageIndex * 318

      return `
        <rect x="${x}" y="420" width="292" height="390" rx="28" fill="#ffffff"
          stroke="rgba(17,12,29,0.12)" stroke-width="2" />
        <image href="${dataUrl}" x="${x + 18}" y="444" width="256" height="286"
          preserveAspectRatio="xMidYMid slice" />
        <text x="${x + 146}" y="774" text-anchor="middle" fill="#110c1d"
          font-family="Montserrat, Arial, sans-serif" font-size="24" font-weight="850">
          ${escapeHtml(label)}
        </text>
      `
    }).join('')}
    <text x="72" y="896" fill="#0f766e" font-family="Montserrat, Arial, sans-serif"
      font-size="27" font-weight="850">React Native · SwiftUI · Jetpack Compose</text>
  `),
  card(4, 'Design + AI', `
    <text x="72" y="320" fill="#110c1d" font-family="Montserrat, Arial, sans-serif"
      font-size="78" font-weight="900">One system.</text>
    <text x="72" y="408" fill="#110c1d" font-family="Montserrat, Arial, sans-serif"
      font-size="78" font-weight="900">More reliable handoffs.</text>
    <rect x="72" y="510" width="446" height="260" rx="30" fill="#ffffff"
      stroke="rgba(124,58,237,0.3)" stroke-width="2" />
    <text x="112" y="578" fill="#6d28d9" font-family="Montserrat, Arial, sans-serif"
      font-size="25" font-weight="900" letter-spacing="1.5">FIGMA</text>
    ${renderLines(['Semantic variables', 'Production variants'], {
      fill: '#110c1d', fontSize: 32, fontWeight: 750, lineHeight: 52, x: 112, y: 650
    })}
    <rect x="542" y="510" width="466" height="260" rx="30" fill="#ffffff"
      stroke="rgba(20,184,166,0.32)" stroke-width="2" />
    <text x="582" y="578" fill="#0f766e" font-family="Montserrat, Arial, sans-serif"
      font-size="25" font-weight="900" letter-spacing="1.5">AI WORKFLOWS</text>
    ${renderLines(['Agent Skill', 'MCP component catalog'], {
      fill: '#110c1d', fontSize: 32, fontWeight: 750, lineHeight: 52, x: 582, y: 650
    })}
    <text x="72" y="878" fill="rgba(17,12,29,0.68)" font-family="Montserrat, Arial, sans-serif"
      font-size="31" font-weight="550">Real component contracts instead of guesswork.</text>
  `),
  card(5, 'Start building', `
    <rect x="72" y="282" width="128" height="6" rx="3" fill="#14b8a6" />
    ${renderLines(['Build an accessible', 'settings screen.'], {
      fill: '#110c1d', fontSize: 76, fontWeight: 900, lineHeight: 90, x: 72, y: 392
    })}
    ${renderLines(wrapText('Follow one practical guide from primitives to responsive, validated product UI.', 42), {
      fill: 'rgba(17,12,29,0.7)', fontSize: 34, fontWeight: 500, lineHeight: 48, x: 72, y: 650
    })}
    <rect x="72" y="832" width="936" height="86" rx="24" fill="#110c1d" />
    <text x="540" y="886" fill="#ffffff" text-anchor="middle"
      font-family="Montserrat, Arial, sans-serif" font-size="28" font-weight="850">
      lumen.santi020k.com/guides/ship-a-settings-screen
    </text>
  `)
]

await fs.mkdir(outputDirectory, { recursive: true })

await Promise.all(cards.map(async (svg, index) => {
  const filename = `lumen-introduction-${index + 1}.png`

  await sharp(Buffer.from(svg.trim())).png({ compressionLevel: 9 }).toFile(
    path.join(outputDirectory, filename)
  )
}))

console.log(`Rendered ${cards.length} Instagram cards to ${outputDirectory}`)
