export interface GuideMetadata {
  author: string
  description: string
  href: string
  icon: string
  publishedAt: string
  readingTime: string
  title: string
  updatedAt?: string
}

export const publishedGuides = [
  {
    author: 'Santiago Molina',
    description: 'Build and verify an accessible notification panel in Astro or React with AI coding agents, Lumen components, and focused MCP context.',
    href: '/guides/build-ui-with-ai',
    icon: 'bot',
    publishedAt: '2026-10-04',
    readingTime: '15 minute build',
    title: 'Build accessible UI with AI in Astro and React'
  },
  {
    author: 'Santiago Molina',
    description: 'Measure AI token usage, tool context, retries, and accessible UI quality when comparing a component library with building from scratch.',
    href: '/guides/measure-ai-ui-token-usage',
    icon: 'chart-no-axes-combined',
    publishedAt: '2026-10-04',
    readingTime: 'Benchmark method',
    title: 'Measure AI token usage when building UI'
  },
  {
    author: 'Santiago Molina',
    description: 'Evaluate Lumen with a production-shaped account surface that includes forms, states, theming, and accessibility checks.',
    href: '/guides/ship-a-settings-screen',
    icon: 'settings-2',
    publishedAt: '2026-08-21',
    readingTime: '20 minute build',
    title: 'Ship an accessible settings screen'
  }
] as const satisfies readonly GuideMetadata[]

export const guideDestinations = [
  ...publishedGuides,
  {
    author: 'Lumen UI',
    description: 'Choose the right form integration for Astro Actions, React Hook Form, or standards-based custom elements.',
    href: '/docs/forms',
    icon: 'list-checks',
    publishedAt: '2026-08-21',
    readingTime: 'Integration guide',
    title: 'Build a validated form flow'
  },
  {
    author: 'Lumen UI',
    description: 'Install the portable skill and connect the MCP catalog so coding agents use real Lumen contracts.',
    href: '/docs/ai-skill',
    icon: 'bot',
    publishedAt: '2026-08-21',
    readingTime: 'AI workflow',
    title: 'Give your coding agent the design system'
  },
  {
    author: 'Lumen UI',
    description: 'Adjust semantic roles in the browser and export a theme without creating a second component palette.',
    href: '/docs/theme-playground',
    icon: 'palette',
    publishedAt: '2026-08-21',
    readingTime: 'Interactive lab',
    title: 'Create a product theme with semantic tokens'
  }
] as const satisfies readonly GuideMetadata[]

export const getGuide = (href: string): GuideMetadata => {
  const guide = publishedGuides.find(entry => entry.href === href)

  if (!guide) throw new Error(`Unknown guide: ${href}`)

  return guide
}
