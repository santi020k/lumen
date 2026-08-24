import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createCards, pathnameOutput } from '@santi020k/og'
import { definePageMetadata } from '@santi020k/og/metadata'
import { definePresetConfig } from '@santi020k/og/presets'

import { componentDocs } from '../src/data/docs.ts'
import { toSlug } from '../src/lib/routes.ts'

const directory = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(directory, '..')

const page = (pathname, title, description, badge) => definePageMetadata({
  badge,
  description,
  image: { alt: `${title} — Lumen UI` },
  pathname,
  title
})

const pages = [
  page('/', 'Write it once. Ship it in any framework.', `A multi-framework primitive UI system with ${componentDocs.length} components for Astro, React, and Web Components.`, 'Home'),
  page('/docs', 'One primitive system, three framework targets.', 'Install Lumen UI and use one semantic component contract across every target.', 'Docs'),
  page('/docs/components', 'Components', `Browse ${componentDocs.length} primitives with live previews for Astro, React, and Elements.`, 'Components'),
  page('/templates', 'Product-ready templates. Free and open source.', 'Install complete analytics, SaaS, commerce, workspace, and onboarding experiences.', 'Templates'),
  page('/guides', 'Start with a product problem.', 'Task-oriented tutorials for accessible, production-shaped workflows.', 'Guides'),
  page('/guides/ship-a-settings-screen', 'Ship an accessible settings screen.', 'Build and verify a responsive account settings surface in every supported framework.', 'Guide'),
  page('/community', 'Made with Lumen.', 'Explore projects built with Lumen, share your work, and shape the roadmap.', 'Community'),
  page('/teams', 'Prove the system before you commit.', 'Evaluate Lumen with a real product surface, real constraints, and no sales gate.', 'For teams'),
  page('/docs/ai-skill', 'Give your AI the design system.', 'Install the portable skill so coding agents select and verify real Lumen components.', 'AI skill'),
  page('/docs/mcp', 'Real component contracts for AI agents.', 'Connect agents to structured components, tokens, recipes, and usage rules.', 'MCP server'),
  page('/docs/figma', 'One product language from design to code.', 'Use semantic variables, component variants, and Code Connect mappings.', 'Figma'),
  page('/docs/theme-playground', 'Build a theme from semantic roles.', 'Tune color roles, preview accessible components, and export the resulting CSS.', 'Theme playground'),
  ...componentDocs.map(component => page(
    `/docs/components/${toSlug(component.name)}`,
    component.name,
    `${component.summary} Usage examples for Astro, React, and Elements.`,
    component.category
  ))
]

export default definePresetConfig({
  cards: createCards(pages, item => ({
    badge: item.badge,
    description: item.description,
    title: item.title,
    variant: 'docs'
  }), {
    output: item => pathnameOutput(item.pathname),
    route: item => ({
      alt: item.image.alt,
      description: item.description,
      pathname: item.pathname,
      title: item.title
    })
  }),
  clean: true,
  concurrency: 'auto',
  outputDirectory: 'public/og/pages',
  routeManifest: { file: 'public/og/manifest.json', publicPath: '/og/pages' },
  preset: {
    brand: { domain: 'lumen.santi020k.com', name: 'Lumen UI' },
    theme: { accent: '#945df4', background: '#0d0718', panel: '#1c1528' },
    variant: 'docs'
  },
  root
})
