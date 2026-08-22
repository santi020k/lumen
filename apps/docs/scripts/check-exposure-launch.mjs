import { access, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const docsRoot = path.resolve(scriptDirectory, '..')
const siteUrl = process.env.LUMEN_EXPOSURE_SITE ?? 'https://lumen.santi020k.com'
const repositoryRawUrl = 'https://raw.githubusercontent.com/santi020k/lumen/main'

const productionRoutes = [
  ['/community', '<title>Community — Lumen UI</title>'],
  ['/teams', '<title>For teams — Lumen UI</title>'],
  ['/guides', '<title>Guides — Lumen UI</title>'],
  [
    '/guides/ship-a-settings-screen',
    '<title>Ship an accessible settings screen — Lumen UI</title>'
  ]
]

const issueTemplates = [
  '.github/ISSUE_TEMPLATE/showcase.yml',
  '.github/ISSUE_TEMPLATE/adoption-feedback.yml'
]

const launchAssets = [
  'figma-to-native-foundations.mp4',
  'figma-to-native-foundations-vertical.mp4',
  'one-screen-three-web-targets.mp4',
  'one-screen-three-web-targets-vertical.mp4',
  'prompt-to-verified-ui.mp4',
  'prompt-to-verified-ui-vertical.mp4'
]

const failures = []

for (const [route, title] of productionRoutes) {
  const url = new URL(route, siteUrl)
  const response = await fetch(url)
  const body = await response.text()
  const isReady = response.ok && body.includes(title)

  process.stdout.write(`${isReady ? 'ready' : 'missing'} route ${url.href}\n`)

  if (!isReady) failures.push(`Production route is not ready: ${url.href}`)
}

for (const template of issueTemplates) {
  const url = `${repositoryRawUrl}/${template}`
  const response = await fetch(url)
  const isReady = response.ok

  process.stdout.write(`${isReady ? 'ready' : 'missing'} template ${template}\n`)

  if (!isReady) failures.push(`Default-branch issue template is not ready: ${template}`)
}

for (const asset of launchAssets) {
  const assetPath = path.join(docsRoot, 'public', 'launch', asset)

  await access(assetPath)

  const assetStat = await stat(assetPath)
  const isReady = assetStat.size > 0

  process.stdout.write(`${isReady ? 'ready' : 'missing'} asset ${asset}\n`)

  if (!isReady) failures.push(`Launch asset is empty: ${asset}`)
}

if (failures.length > 0) {
  process.stderr.write(`\nExposure launch is not ready:\n- ${failures.join('\n- ')}\n`)

  process.exitCode = 1
} else {
  process.stdout.write('\nExposure launch preflight passed.\n')
}
