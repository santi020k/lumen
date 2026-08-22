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
  description:
    `A multi-framework primitive UI system with ${componentDocs.length} components ` +
    'for Astro, React, and Web Components.',
  title: 'Write it once. Ship it in any framework.',
  type: 'Home'
})

addPage('/docs', {
  description:
    'Install Lumen UI, load the shared stylesheet, and use one semantic component contract across every target.',
  title: 'One primitive system, three framework targets.',
  type: 'Docs'
})

addPage('/docs/components', {
  description:
    `Browse ${componentDocs.length} Lumen UI primitives with live previews and usage examples ` +
    'for Astro, React, and Elements.',
  title: 'Components',
  type: 'Components'
})

addPage('/templates', {
  description:
    'Install complete analytics, SaaS, commerce, workspace, and onboarding experiences for Astro, React, or Web Components.',
  title: 'Product-ready templates. Free and open source.',
  type: 'Templates'
})

addPage('/guides', {
  description:
    'Task-oriented tutorials that combine Lumen primitives into accessible, production-shaped product workflows.',
  title: 'Start with a product problem.',
  type: 'Guides'
})

addPage('/guides/ship-a-settings-screen', {
  description:
    'Build and verify a responsive account settings surface in Astro, React, or Web Components.',
  title: 'Ship an accessible settings screen.',
  type: 'Guide'
})

addPage('/community', {
  description:
    'Explore projects built with Lumen, share your work, and help shape the open-source roadmap.',
  title: 'Made with Lumen.',
  type: 'Community'
})

addPage('/teams', {
  description:
    'Evaluate Lumen with a real product surface, real constraints, and no sales gate.',
  title: 'Prove the system before you commit.',
  type: 'For teams'
})

addPage('/docs/ai-skill', {
  description:
    'Install the portable Lumen skill so coding agents select, compose, theme, and verify real Lumen components.',
  title: 'Give your AI the design system.',
  type: 'AI skill'
})

addPage('/docs/mcp', {
  description:
    'Connect AI agents to structured Lumen components, framework contracts, tokens, recipes, and usage rules.',
  title: 'Real component contracts for AI agents.',
  type: 'MCP server'
})

addPage('/docs/figma', {
  description:
    'Use the public Figma library, semantic variables, component variants, and Code Connect mappings.',
  title: 'One product language from design to code.',
  type: 'Figma'
})

addPage('/docs/theme-playground', {
  description:
    'Tune semantic color roles, preview accessible Lumen components, and export the resulting CSS.',
  title: 'Build a theme from semantic roles.',
  type: 'Theme playground'
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

const pending = force ?
  specs :
  specs.filter(spec => !fs.existsSync(spec.outputPath))

const start = performance.now()

process.stdout.write(
  `\nGenerating ${pending.length}/${specs.length} OG images...\n`
)

await Promise.all(pending.map(generateOne))

const elapsed = ((performance.now() - start) / 1000).toFixed(2)

process.stdout.write(`\nDone in ${elapsed}s\n`)
