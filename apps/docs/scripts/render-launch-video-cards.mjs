import { promises as fs } from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

import { renderOgCard } from './render-og-card.js'

const outputDirectory = process.argv[2]

if (!outputDirectory) {
  throw new Error('Pass an output directory for the launch video cards.')
}

const campaigns = {
  figma: [
    {
      description: 'Use a public Figma library with semantic variables and production component variants.',
      title: 'Figma variables',
      type: 'Design'
    },
    {
      description: 'Keep color, spacing, radius, and behavior roles aligned without forcing identical platform APIs.',
      title: 'Semantic product roles',
      type: 'System'
    },
    {
      description: 'One product language across web, React Native, SwiftUI, and Jetpack Compose.',
      title: 'Native behavior',
      type: 'Foundations'
    }
  ],
  skill: [
    {
      description: 'Ask for a production screen in the framework and architecture your application already uses.',
      title: 'Start with intent',
      type: 'Prompt'
    },
    {
      description: 'The Lumen skill and MCP catalog provide real components, props, tokens, and usage rules.',
      title: 'Retrieve real contracts',
      type: 'AI workflow'
    },
    {
      description: 'Check responsive states, keyboard paths, labels, validation, and framework-specific setup.',
      title: 'Verify the interface',
      type: 'Accessible UI'
    }
  ],
  web: [
    {
      description: 'Forms, feedback, navigation, data display, product states, and semantic tokens.',
      title: 'One accessible product surface',
      type: 'Lumen UI'
    },
    {
      description: 'Framework-native authoring with one shared visual and accessibility contract.',
      title: 'Astro · React · Elements',
      type: 'Three web targets'
    },
    {
      description: 'More than 150 primitives, five product template families, Figma resources, and AI workflows.',
      title: 'Free and MIT licensed',
      type: 'Start building'
    }
  ]
}

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

const renderLines = (lines, { fontSize, fontWeight, lineHeight, y }) => lines
  .map((line, index) => `
    <text
      x="72"
      y="${y + index * lineHeight}"
      fill="#110c1d"
      font-family="Montserrat, Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="${fontWeight}"
    >${escapeHtml(line)}</text>
  `)
  .join('')

const renderVerticalCard = ({ description, title, type }) => {
  const titleLines = wrapText(title, 20)
  const descriptionLines = wrapText(description, 38)
  const descriptionY = 790 + titleLines.length * 100

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
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
        <radialGradient id="purple" cx="18%" cy="18%" r="40%">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="teal" cx="82%" cy="26%" r="38%">
          <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="1080" height="1920" fill="url(#bg)" />
      <rect width="1080" height="1920" fill="url(#purple)" />
      <rect width="1080" height="1920" fill="url(#teal)" />
      <rect x="72" y="72" width="936" height="5" fill="url(#accent)" />

      <rect x="72" y="116" width="116" height="116" rx="30"
        fill="rgba(255,255,255,0.78)" stroke="rgba(17,12,29,0.12)" />
      <text x="130" y="202" fill="#7c3aed" font-family="Montserrat, Arial, sans-serif"
        font-size="78" font-weight="900" text-anchor="middle">L</text>
      <text x="220" y="164" fill="#110c1d" font-family="Montserrat, Arial, sans-serif"
        font-size="42" font-weight="900">Lumen UI</text>
      <text x="220" y="208" fill="rgba(17,12,29,0.56)" font-family="Montserrat, Arial, sans-serif"
        font-size="20" font-weight="900" letter-spacing="2">LUMEN.SANTI020K.COM</text>

      <rect x="72" y="360" width="420" height="64" rx="32"
        fill="rgba(96,165,250,0.14)" stroke="rgba(96,165,250,0.34)" />
      <text x="282" y="402" fill="#2563eb" font-family="Montserrat, Arial, sans-serif"
        font-size="22" font-weight="900" letter-spacing="2" text-anchor="middle">
        ${escapeHtml(type).toUpperCase()}
      </text>

      <rect x="72" y="648" width="132" height="6" rx="3" fill="#7c3aed" />
      ${renderLines(titleLines, { fontSize: 86, fontWeight: 900, lineHeight: 100, y: 790 })}
      ${renderLines(descriptionLines, { fontSize: 34, fontWeight: 450, lineHeight: 52, y: descriptionY })}

      <text x="72" y="1760" fill="#7c3aed" font-family="Montserrat, Arial, sans-serif"
        font-size="28" font-weight="900">FREE · OPEN SOURCE · MIT</text>
      <text x="72" y="1820" fill="rgba(17,12,29,0.54)" font-family="Montserrat, Arial, sans-serif"
        font-size="26" font-weight="800">Web · Native · Figma · AI workflows</text>
    </svg>
  `
}

await fs.mkdir(outputDirectory, { recursive: true })

await Promise.all(Object.entries(campaigns).flatMap(([campaign, cards]) => (
  cards.map(async (props, index) => {
    const outputPath = path.join(outputDirectory, `${campaign}-${index + 1}.webp`)

    const verticalOutputPath = path.join(
      outputDirectory, `${campaign}-${index + 1}-vertical.webp`
    )

    const buffer = await renderOgCard(props)

    const verticalBuffer = await sharp(Buffer.from(renderVerticalCard(props).trim()))
      .webp({ effort: 0, quality: 84 })
      .toBuffer()

    await Promise.all([
      fs.writeFile(outputPath, buffer),
      fs.writeFile(verticalOutputPath, verticalBuffer)
    ])
  })
)))
