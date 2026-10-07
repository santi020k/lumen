import { componentDocs } from './docs.ts'

interface SitePageMetadata {
  badge: string
  description: string
  pathname: string
  title: string
}

export const documentedComponentCount = componentDocs.length

export const primaryPageMetadata = {
  components: {
    badge: 'Components',
    description: 'Browse all Lumen UI components with live previews and usage examples for Astro, React, and Elements.',
    pathname: '/docs/components',
    title: 'Components - Lumen UI'
  },
  docs: {
    badge: 'Docs',
    description: 'Build accessible web and native interfaces with Lumen components, AI agent skills, and framework-specific API guidance.',
    pathname: '/docs',
    title: 'Documentation - Lumen UI'
  },
  home: {
    badge: 'Home',
    description: `Build with AI using ${documentedComponentCount} accessible primitives, agent skills, and focused MCP context. One UI library for web and native apps.`,
    pathname: '/',
    title: 'Lumen UI — Accessible Components for AI Coding Agents'
  }
} as const satisfies Record<string, SitePageMetadata>
