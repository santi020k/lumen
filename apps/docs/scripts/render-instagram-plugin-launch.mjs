import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public')
const outputDirectory = path.join(publicDirectory, 'launch/instagram/lumen-plugin-launch')
const logo = await fs.readFile(path.join(publicDirectory, 'logo.svg'))
const logoUrl = `data:image/svg+xml;base64,${logo.toString('base64')}`

const listing = await sharp(path.join(outputDirectory, 'directory-listing.jpg'))
  .extract({ left: 382, top: 82, width: 780, height: 580 })
  .png()
  .toBuffer()

const listingUrl = `data:image/png;base64,${listing.toString('base64')}`

const escapeText = value => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')

const text = (value, x, y, size, weight = 800, fill = '#110c1d') => `
  <text x="${x}" y="${y}" font-family="Montserrat, Arial, sans-serif"
    font-size="${size}" font-weight="${weight}" fill="${fill}">${escapeText(value)}</text>
`

const card = (index, contents) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
    <defs>
      <linearGradient id="background" x2="1" y2="1">
        <stop stop-color="#f8f6fd" />
        <stop offset="0.6" stop-color="#eef8f6" />
        <stop offset="1" stop-color="#fff7ed" />
      </linearGradient>
      <linearGradient id="accent">
        <stop stop-color="#7c3aed" />
        <stop offset="0.6" stop-color="#14b8a6" />
        <stop offset="1" stop-color="#f59e0b" />
      </linearGradient>
      <clipPath id="listing-clip"><rect x="90" y="340" width="900" height="669" rx="24" /></clipPath>
    </defs>
    <rect width="1080" height="1080" fill="url(#background)" />
    <rect x="90" y="68" width="900" height="5" rx="2.5" fill="url(#accent)" />
    <image href="${logoUrl}" x="90" y="104" width="286" height="74" />
    ${text('PLUGIN LAUNCH', 720, 149, 22, 800, '#6d28d9')}
    ${contents}
    ${text('@lumenui.dev', 90, 1030, 22, 700, '#6d28d9')}
    ${text(`${index} / 3`, 916, 1030, 22, 700, '#6d28d9')}
  </svg>
`

const slides = [
  card(1, `
    ${text('Now in', 90, 345, 98, 900)}
    ${text('ChatGPT.', 90, 475, 122, 900)}
    ${text('And Codex.', 90, 587, 76, 850, '#6d28d9')}
    <rect x="90" y="654" width="128" height="6" rx="3" fill="#14b8a6" />
    ${text('The Lumen workflow skill,', 90, 745, 36, 500)}
    ${text('with a real component catalog.', 90, 797, 36, 500)}
    <rect x="90" y="870" width="445" height="68" rx="34" fill="#110c1d" />
    ${text('PUBLISHED · VERSION 1.0.0', 117, 913, 24, 800, '#ffffff')}
  `),
  card(2, `
    ${text('A real catalog. Ready to use.', 90, 268, 52, 900)}
    ${text('Components · recipes · tokens · usage', 90, 319, 29, 550, '#6d28d9')}
    <image href="${listingUrl}" x="90" y="350" width="900" height="635"
      preserveAspectRatio="xMidYMid meet" clip-path="url(#listing-clip)" />
  `),
  card(3, `
    ${text('Start with Lumen.', 90, 295, 72, 900)}
    ${text('01', 90, 410, 32, 900, '#6d28d9')}
    ${text('Open Plugins in ChatGPT or Codex.', 162, 410, 32, 650)}
    ${text('02', 90, 480, 32, 900, '#6d28d9')}
    ${text('Find Lumen UI. Select Install plugin.', 162, 480, 32, 650)}
    ${text('03', 90, 550, 32, 900, '#6d28d9')}
    ${text('Mention @Lumen UI in your request.', 162, 550, 32, 650)}
    <rect x="90" y="621" width="900" height="233" rx="28" fill="#110c1d" />
    ${text('TRY THIS PROMPT', 126, 670, 22, 800, '#ffffff')}
    ${text('Find the right Lumen components', 126, 731, 34, 650, '#ffffff')}
    ${text('for an accessible React settings screen.', 126, 784, 34, 650, '#ffffff')}
    ${text('No separate Lumen account or API key.', 90, 922, 29, 600, '#6d28d9')}
    ${text('No local MCP setup.', 90, 965, 29, 600, '#6d28d9')}
  `)
]

await fs.mkdir(outputDirectory, { recursive: true })

for (const [index, svg] of slides.entries()) {
  await sharp(Buffer.from(svg.trim())).png({ compressionLevel: 9 })
    .toFile(path.join(outputDirectory, `lumen-plugin-launch-${index + 1}.png`))
}

console.log(`Rendered ${slides.length} plugin-launch cards to ${outputDirectory}`)
