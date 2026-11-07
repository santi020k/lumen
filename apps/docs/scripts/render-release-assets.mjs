import { createHash } from 'node:crypto'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '../../..')
const output = path.join(root, 'docs/assets/releases/v5.0.0')
const tokens = JSON.parse(await readFile(path.join(root, 'tokens/lumen.tokens.json'), 'utf8'))
const palette = Object.fromEntries(Object.entries(tokens.color.light).filter(([name]) => !name.startsWith('$')).map(([name, token]) => [name, token.$value]))
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const dataUrl = async file => `data:image/png;base64,${(await sharp(path.join(root, file)).png().toBuffer()).toString('base64')}`
const logo = await dataUrl('apps/docs/public/logo.svg')
const text = (value, x, y, size, weight = 500, color = palette.ink) => `<text x="${x}" y="${y}" fill="${color}" font-family="Montserrat, Arial, sans-serif" font-size="${size}" font-weight="${weight}">${escape(value)}</text>`
const frame = (width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${palette.canvas}"/>${content}</svg>`
const image = (src, x, y, width, height) => `<image href="${src}" x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`
const web = await dataUrl('docs/assets/releases/v5.0.0/screenshots/web-workspace-light.webp')
const apple = await dataUrl('apps/playground-apple/Store/Screenshots/iphone-02-examples-light.png')
const android = await dataUrl('apps/playground-android/Store/Screenshots/phone-06-examples-dark.png')
const paper = await dataUrl('docs/assets/releases/v5.0.0/screenshots/react-native-settings-light.webp')
const dark = await dataUrl('docs/assets/releases/v5.0.0/screenshots/react-native-profile-dark.webp')
const artwork = []

await mkdir(path.join(output, 'social'), { recursive: true })

for (const [name, source, width] of [
  ['web', 'docs/assets/releases/v5.0.0/screenshots/web-workspace-light.webp', 1184],
  ['react-native', 'docs/assets/releases/v5.0.0/screenshots/react-native-profile-light.webp', 390],
  ['apple', 'apps/playground-apple/Store/Screenshots/iphone-02-examples-light.png', 792],
  ['android', 'apps/playground-android/Store/Screenshots/phone-02-examples-light.png', 720]
]) {
  await sharp(path.join(root, source)).resize({ width }).webp({ quality: 88 })
    .toFile(path.join(root, `apps/docs/src/assets/platforms/${name}.webp`))
}

const render = async (file, svg, alt) => {
  const filename = path.join(root, file)

  const result = await sharp(Buffer.from(svg)).flatten({ background: palette.canvas })
    .removeAlpha().png().toFile(filename)

  artwork.push({ file, width: result.width, height: result.height, alt })
}

for (const [format, width, height] of [['square', 1080, 1080], ['portrait', 1080, 1920], ['landscape', 1920, 1080]]) {
  const wide = format === 'landscape'
  const tall = format === 'portrait'
  const left = wide ? 120 : 90
  const top = tall ? 250 : 90
  const headingY = top + 160
  const imageY = headingY + 135
  const imageHeight = tall ? 820 : 520
  const footerY = tall ? 1640 : 985
  const chrome = `${image(logo, left - 8, top, 248, 64)}${text('LUMEN UI 5', width - left - 180, top + 42, 22, 700, palette['brand-solid'])}`
  const footer = `${text('lumen.santi020k.com', left, footerY, 22, 600)}${text('by santi020k', width - left - 160, footerY, 20, 500, palette['ink-soft'])}`
  const nativeX = wide ? 1120 : 595
  const nativeWidth = wide ? 330 : 300
  const firstX = wide ? 520 : 185

  const slides = [
    {
      name: '01-modular-web',
      title: 'Build what your page needs.',
      subtitle: 'Modular delivery. Editable recipes. Shared foundations.',
      body: image(web, left, imageY, width - left * 2, imageHeight),
      alt: 'Lumen UI 5: Build what your page needs. A real web workspace shows navigation, metric cards, a chart, and a task form.'
    },
    {
      name: '02-native-playgrounds',
      title: 'Explore the real components.',
      subtitle: 'SwiftUI and Compose playgrounds, in light and dark.',
      body: `${image(apple, firstX, imageY, nativeWidth, imageHeight)}${image(android, nativeX, imageY, nativeWidth, imageHeight)}${text('SwiftUI · simulator', firstX, imageY + imageHeight + 38, 20)}${text('Compose · emulator', nativeX, imageY + imageHeight + 38, 20)}`,
      alt: 'Native Lumen playground release examples: SwiftUI in light mode beside Jetpack Compose in dark mode, captured from local builds.'
    },
    {
      name: '03-shared-themes',
      title: 'Make the system your own.',
      subtitle: 'Explore themes, appearances, and composed examples.',
      body: `${image(paper, firstX, imageY, nativeWidth, imageHeight)}${image(dark, nativeX, imageY, nativeWidth, imageHeight)}${text('React Native · Expo browser previews', left, imageY + imageHeight + 38, 20)}`,
      alt: 'React Native Expo browser previews show Paper theme settings and a dark contributor profile. These are browser renders.'
    }
  ]

  for (const slide of slides) {
    const svg = frame(width, height, `${chrome}${text(slide.title, left, headingY, wide ? 70 : 49, 700)}${text(slide.subtitle, left, headingY + 60, wide ? 30 : 25, 500, palette['ink-soft'])}${slide.body}${footer}`)

    await render(`docs/assets/releases/v5.0.0/social/${format}-${slide.name}.png`, svg, slide.alt)
  }
}

await render('docs/assets/releases/v5.0.0/social/release-cover-1200x630.png', frame(1200, 630, `${image(logo, 52, 45, 248, 64)}${text('LUMEN UI 5', 60, 195, 22, 700, palette['brand-solid'])}${text('Build what', 60, 270, 58, 700)}${text('your page needs.', 60, 342, 58, 700)}${text('Modular delivery.', 60, 412, 26)}${text('Editable recipes.', 60, 454, 26)}${image(web, 590, 140, 550, 390)}${text('lumen.santi020k.com', 60, 575, 22, 600)}${text('by santi020k', 970, 575, 20)}`), 'Lumen UI 5: modular delivery and editable recipes, beside a real Lumen web workspace.')

const feature = frame(1024, 500, `<rect width="1024" height="500" fill="${palette['brand-soft']}"/>${text('Lumen', 72, 175, 62, 700)}${text('Playground', 72, 246, 62, 700)}${text('Explore native components,', 76, 310, 24)}${text('themes, and real interactions.', 76, 348, 24)}${image(android, 664, 36, 250, 428)}`)

await writeFile(path.join(root, 'apps/playground-android/Store/feature-graphic.svg'), `${feature}\n`)

await render('apps/playground-android/Store/feature-graphic.png', feature, 'Lumen Playground with a native Compose release example in dark mode.')

await writeFile(path.join(output, 'artwork.json'), `${JSON.stringify({ artwork }, null, 2)}\n`)

// Inventory only generated media and store inputs; provenance is recorded separately.
const sources = [
  'docs/assets/releases/v5.0.0/screenshots',
  'docs/assets/releases/v5.0.0/apple-medium',
  'docs/assets/releases/v5.0.0/social',
  'apps/playground-apple/Store/Screenshots',
  'apps/playground-android/Store/Screenshots',
  'apps/playground-android/Store',
  'apps/docs/src/assets/platforms'
]

const assets = []

for (const directory of sources) {
  for (const name of (await readdir(path.join(root, directory))).sort()) {
    if (!/\.(png|webp)$/.test(name)) continue

    const file = `${directory}/${name}`
    const bytes = await readFile(path.join(root, file))
    const metadata = await sharp(bytes).metadata()

    assets.push({ file, bytes: bytes.length, width: metadata.width, height: metadata.height, hasAlpha: metadata.hasAlpha, sha256: createHash('sha256').update(bytes).digest('hex') })
  }
}

await writeFile(path.join(output, 'inventory.json'), `${JSON.stringify({ assets }, null, 2)}\n`)

console.log(`Rendered ${artwork.length} release graphics; inventoried ${assets.length} images.`)
