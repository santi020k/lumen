import { lumenComponentNames } from '@santi020k/lumen-core'

import { toSlug } from '../lib/routes'

import {
  componentDocs,
  elementsApiReference,
  frameworkGuides,
  frameworkSetups,
  glassSurfaceExamples,
  globalStyleSetups,
  reactHooksReference,
  runtimeEvents,
  themeSetups
} from './docs'

export interface DocsSearchItem {
  category: string
  description: string
  href: string
  keywords: string
  title: string
  type: 'Component' | 'Event' | 'Prop' | 'Recipe'
}

const canonicalComponentNames = new Set<string>(lumenComponentNames)

const normalizeKeywords = (...values: string[]): string =>
  values
    .join(' ')
    .replaceAll(/["'{}[\]|,]/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const componentItems: DocsSearchItem[] = componentDocs.map(component => ({
  category: component.category,
  description: component.summary,
  href: `/docs/components/${toSlug(component.name)}`,
  keywords: normalizeKeywords(
    component.name,
    component.category,
    component.summary,
    component.guidance?.when ?? '',
    component.guidance?.distinction ?? '',
    component.glass ? 'glass surface' : '',
    canonicalComponentNames.has(component.name) ? 'canonical component primitive' : ''
  ),
  title: component.name,
  type: 'Component'
}))

const propItems: DocsSearchItem[] = componentDocs.flatMap(component =>
  component.apiReference.map(row => ({
    category: component.name,
    description: row.description,
    href: `/docs/components/${toSlug(component.name)}#api-title`,
    keywords: normalizeKeywords(component.name, row.attribute, row.values, row.defaultValue, row.description),
    title: `${component.name}: ${row.attribute}`,
    type: 'Prop' as const
  }))
)

const keyboardItems: DocsSearchItem[] = componentDocs.flatMap(component =>
  (component.keyboardInteractions ?? []).map(row => ({
    category: component.name,
    description: row.action,
    href: `/docs/components/${toSlug(component.name)}#keyboard-title`,
    keywords: normalizeKeywords(component.name, row.key, row.action, 'keyboard interaction shortcut'),
    title: `${component.name}: ${row.key}`,
    type: 'Recipe' as const
  }))
)

const eventItems: DocsSearchItem[] = runtimeEvents.map(event => {
  const owner = componentDocs.find(component => component.runtimeEvents?.some(item => item.name === event.name))

  return {
    category: owner?.name ?? 'Runtime',
    description: event.when,
    href: owner ? `/docs/components/${toSlug(owner.name)}#runtime-events-title` : '/docs',
    keywords: normalizeKeywords(event.name, event.target, event.detail, event.when),
    title: event.name,
    type: 'Event' as const
  }
})

const recipeItems: DocsSearchItem[] = [
  {
    category: 'Getting started',
    description: 'Install Lumen, load the shared stylesheet, and choose Astro, React, or Elements.',
    href: '/docs#installation',
    keywords: normalizeKeywords('install setup getting started framework package astro react elements stylesheet'),
    title: 'Install and use Lumen',
    type: 'Recipe'
  },
  {
    category: 'Themes',
    description: 'Generate theme tokens from a hue, preview Lumen components, and copy CSS.',
    href: '/docs/theme-playground',
    keywords: normalizeKeywords('theme playground hue accent dark light createThemeFromHue tokens css export preview'),
    title: 'Theme playground',
    type: 'Recipe'
  },
  {
    category: 'Figma',
    description: 'Open the Lumen Figma library and learn how variables, pages, and component variants map back to code.',
    href: '/docs/figma',
    keywords: normalizeKeywords('figma library design file variables tokens color radius cover foundations components variants code connect handoff'),
    title: 'Lumen Figma library',
    type: 'Recipe'
  },
  {
    category: 'AI integration',
    description: 'Install the portable Lumen UI Agent Skill for Codex, Claude Code, Cursor, Windsurf, and other compatible AI coding tools.',
    href: '/docs/ai-skill',
    keywords: normalizeKeywords('ai agent skill skills install codex claude code cursor windsurf gemini github copilot native ui design system npx skills add'),
    title: 'Lumen AI skill',
    type: 'Recipe'
  },
  {
    category: 'AI integration',
    description: 'Connect the Lumen MCP server so AI agents can list components, read real source and props, and follow Lumen tokens and rules.',
    href: '/docs/mcp',
    keywords: normalizeKeywords('mcp model context protocol ai agent claude cursor server tools list components get component search tokens rules llms stdio npx'),
    title: 'Lumen MCP server',
    type: 'Recipe'
  },
  {
    category: 'Foundations',
    description: 'Browse the full Lucide icon set available through the Lumen Icon component and copy icon names.',
    href: '/docs/icons',
    keywords: normalizeKeywords('icons lucide icon component name alias search catalog svg glyph symbol foundations'),
    title: 'Icons catalog',
    type: 'Recipe'
  },
  ...frameworkSetups.map(setup => ({
    category: 'Framework setup',
    description: setup.note,
    href: `/docs/frameworks/${setup.id}#install-title`,
    keywords: normalizeKeywords(setup.label, setup.packageName, setup.note, setup.usage),
    title: `${setup.label} setup`,
    type: 'Recipe' as const
  })),
  ...frameworkGuides.map(guide => ({
    category: 'Framework guides',
    description: guide.body.join(' '),
    href: `/docs/frameworks/${guide.id}`,
    keywords: normalizeKeywords(guide.title, guide.packageName, guide.body.join(' '), guide.code),
    title: `${guide.title} framework guide`,
    type: 'Recipe' as const
  })),
  ...reactHooksReference.map(hook => ({
    category: 'React Hooks',
    description: hook.description,
    href: `/docs/frameworks/react#${hook.name}`,
    keywords: normalizeKeywords(hook.name, hook.description, 'react hook use state'),
    title: hook.name,
    type: 'Recipe' as const
  })),
  ...elementsApiReference.map(api => ({
    category: 'Elements API',
    description: api.description,
    href: `/docs/frameworks/elements#${api.name}`,
    keywords: normalizeKeywords(api.name, api.description, 'elements web components api'),
    title: api.name,
    type: 'Recipe' as const
  })),
  ...globalStyleSetups.map(setup => ({
    category: 'Shared stylesheet',
    description: setup.description,
    href: '/docs#global-styles',
    keywords: normalizeKeywords(setup.label, setup.description, setup.code, 'styles css tailwind'),
    title: setup.label,
    type: 'Recipe' as const
  })),
  ...themeSetups.map(setup => ({
    category: 'Themes',
    description: setup.description,
    href: '/docs#themes',
    keywords: normalizeKeywords(setup.label, setup.description, setup.code, 'theme tokens'),
    title: setup.label,
    type: 'Recipe' as const
  })),
  ...glassSurfaceExamples.map(example => ({
    category: 'Glassmorphism',
    description: example.description,
    href: '/docs#glassmorphism',
    keywords: normalizeKeywords(example.label, example.description, example.code, 'glass surface blur'),
    title: example.label,
    type: 'Recipe' as const
  }))
]

export const docsSearchIndex: DocsSearchItem[] = [
  ...componentItems,
  ...propItems,
  ...keyboardItems,
  ...eventItems,
  ...recipeItems
]
