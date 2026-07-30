import sharp from 'sharp'

const homeBadge = { background: 'rgba(167,139,250,0.16)', border: 'rgba(167,139,250,0.36)', text: '#7c3aed' }
const docsBadge = { background: 'rgba(96,165,250,0.14)', border: 'rgba(96,165,250,0.34)', text: '#2563eb' }
const componentsBadge = { background: 'rgba(20,184,166,0.14)', border: 'rgba(20,184,166,0.34)', text: '#0f766e' }

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const getTitleSize = (title) => {
  if (title.length <= 24) return 88

  if (title.length <= 44) return 74

  if (title.length <= 64) return 60

  return 50
}

const getBadge = (type) => {
  if (type === 'Home') return homeBadge

  if (type === 'Components') return componentsBadge

  return docsBadge
}

const appendEllipsis = (value) => `${value.replace(/[,.!?;:]?$/, '')}...`

const wrapText = (value, maxLineLength, maxLines) => {
  const words = value.split(/\s+/)
  const lines = []
  let line = ''
  let truncated = false

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word

    if (nextLine.length > maxLineLength && line) {
      lines.push(line)

      line = word
    } else {
      line = nextLine
    }

    if (lines.length === maxLines) {
      truncated = true

      break
    }
  }

  if (line && lines.length < maxLines) lines.push(line)

  const lastLine = lines.at(-1)

  if (truncated && lastLine) return [...lines.slice(0, -1), appendEllipsis(lastLine)]

  return lines
}

const renderTextLines = (lines, options) =>
  lines
    .map(
      (line, index) => `
    <text
      x="${options.x}"
      y="${options.y + index * options.lineHeight}"
      fill="${options.fill}"
      font-family="Montserrat, Arial, sans-serif"
      font-size="${options.fontSize}"
      font-weight="${options.fontWeight}"
    >${escapeHtml(line)}</text>
  `,
    )
    .join('')

const renderCard = ({ description, title, type }) => {
  const titleSize = getTitleSize(title)
  const badge = getBadge(type)
  const titleLines = wrapText(title, titleSize >= 74 ? 25 : 34, 3)
  const descriptionLines = wrapText(description, 74, 2)
  const descriptionY = 342 + (titleLines.length - 1) * titleSize * 1.06 + 44

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
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
        <radialGradient id="purple" cx="18%" cy="18%" r="34%">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#7c3aed" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="teal" cx="82%" cy="22%" r="30%">
          <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.22" />
          <stop offset="100%" stop-color="#14b8a6" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect width="1200" height="630" fill="url(#bg)" />
      <rect width="1200" height="630" fill="url(#purple)" />
      <rect width="1200" height="630" fill="url(#teal)" />
      <rect x="64" y="58" width="1072" height="3" fill="url(#accent)" />

      <rect x="64" y="72" width="82" height="82" rx="22" fill="rgba(255,255,255,0.76)" stroke="rgba(17,12,29,0.12)" />
      <text x="104" y="135" fill="#7c3aed" font-family="Montserrat, Arial, sans-serif" font-size="58" font-weight="900" text-anchor="middle">L</text>
      <text x="164" y="109" fill="#110c1d" font-family="Montserrat, Arial, sans-serif" font-size="28" font-weight="900">Lumen UI</text>
      <text x="164" y="138" fill="rgba(17,12,29,0.56)" font-family="Montserrat, Arial, sans-serif" font-size="15" font-weight="900" letter-spacing="2">LUMEN.SANTI020K.COM</text>

      <rect x="912" y="88" width="224" height="44" rx="22" fill="${badge.background}" stroke="${badge.border}" />
      <text x="1024" y="116" fill="${badge.text}" font-family="Montserrat, Arial, sans-serif" font-size="16" font-weight="900" letter-spacing="2" text-anchor="middle">${escapeHtml(type).toUpperCase()}</text>

      <rect x="64" y="254" width="116" height="4" rx="2" fill="#7c3aed" />
      ${renderTextLines(titleLines, { fill: '#110c1d', fontSize: titleSize, fontWeight: 900, lineHeight: titleSize * 1.06, x: 64, y: 342 })}
      ${renderTextLines(descriptionLines, { fill: 'rgba(17,12,29,0.68)', fontSize: 24, fontWeight: 400, lineHeight: 36, x: 64, y: descriptionY })}

      <text x="64" y="574" fill="#7c3aed" font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="900">Astro · React · Web Components</text>
      <text x="1136" y="574" fill="rgba(17,12,29,0.52)" font-family="Montserrat, Arial, sans-serif" font-size="18" font-weight="900" text-anchor="end">Semantic primitives for product interfaces</text>
    </svg>
  `
}

export const renderOgCard = async (props) => {
  const svg = Buffer.from(renderCard(props).trim())

  return sharp(svg).webp({ effort: 0, quality: 82 }).toBuffer()
}
