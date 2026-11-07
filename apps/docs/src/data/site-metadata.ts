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
    description: 'Explore accessible UI components for Astro, React, and Web Components. Try live examples and find installation, props, events, and keyboard guidance.',
    pathname: '/docs/components',
    title: 'UI Components for Astro, React & Web Components - Lumen UI'
  },
  docs: {
    badge: 'Docs',
    description: 'Set up Lumen UI for Astro, React, Web Components, React Native, SwiftUI, or Jetpack Compose. Explore component APIs, design tokens, and AI agent tools.',
    pathname: '/docs',
    title: 'UI Library Setup & API Documentation - Lumen UI'
  },
  home: {
    badge: 'Home',
    description: `Build with AI using ${documentedComponentCount} accessible primitives, agent skills, and focused MCP context. One UI library for web and native apps.`,
    pathname: '/',
    title: 'Lumen UI — Accessible Components for AI Coding Agents'
  }
} as const satisfies Record<string, SitePageMetadata>
