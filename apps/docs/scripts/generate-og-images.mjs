import fs, { promises as fsp } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { componentDocs } from '../src/data/docs.ts'
import { toSlug } from '../src/lib/routes.ts'
import { getSocialImageSlug } from '../src/lib/social-image.ts'

import { renderOgCard } from './render-og-card.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outputDirectory = path.join(root, 'public', 'og', 'pages')
const force = process.env.FORCE_OG === '1'

const specs = []

const addPage = (pathname, props) => {
  const slug = getSocialImageSlug(pathname) || 'index'

  specs.push({
    outputPath: path.join(outputDirectory, `${slug}.webp`),
    props
  })
}

addPage('/', {
  description: `A multi-framework primitive UI system with ${componentDocs.length} components for Astro, React, and Web Components.`,
  title: 'Write it once. Ship it in any framework.',
  type: 'Home'
})

addPage('/docs', {
  description: 'Install Lumen UI, load the shared stylesheet, and use one semantic component contract across every target.',
  title: 'One primitive system, three framework targets.',
  type: 'Docs'
})

addPage('/docs/components', {
  description: `Browse ${componentDocs.length} Lumen UI primitives with live previews and usage examples for Astro, React, and Elements.`,
  title: 'Components',
  type: 'Components'
})

for (const component of componentDocs) {
  addPage(`/docs/components/${toSlug(component.name)}`, {
    description: `${component.summary} Usage examples for Astro, React, and Elements.`,
    title: component.name,
    type: component.category
  })
}

const generateOne = async ({ outputPath, props }) => {
  if (!force && fs.existsSync(outputPath)) return

  const buffer = await renderOgCard(props)

  await fsp.mkdir(path.dirname(outputPath), { recursive: true })
  await fsp.writeFile(outputPath, buffer)

  process.stdout.write(`  write ${path.relative(root, outputPath)}\n`)
}

const pending = force ? specs : specs.filter(spec => !fs.existsSync(spec.outputPath))
const start = performance.now()

console.log(`\nGenerating ${pending.length}/${specs.length} OG images...\n`)

await Promise.all(pending.map(generateOne))

const elapsed = ((performance.now() - start) / 1000).toFixed(2)

console.log(`\nDone in ${elapsed}s\n`)
