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
    description: 'Choose the Lumen UI documentation for Web, React Native, Apple platforms, or Android, and explore their shared foundations.',
    pathname: '/docs',
    title: 'Documentation - Lumen UI'
  },
  home: {
    badge: 'Home',
    description: `Lumen is a crafted multi-framework UI system with ${documentedComponentCount} accessible primitives for Web, React Native, Apple platforms, and Android.`,
    pathname: '/',
    title: 'Lumen UI — Crafted primitives for web and native platforms'
  }
} as const satisfies Record<string, SitePageMetadata>
