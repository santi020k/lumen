import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createCards, pathnameOutput } from '@santi020k/og'
import { definePageMetadata } from '@santi020k/og/metadata'
import { definePresetConfig } from '@santi020k/og/presets'

import { componentDocs } from '../src/data/docs.ts'
import { getNativeComponentsForPlatform } from '../src/data/native-components.ts'
import { primaryPageMetadata } from '../src/data/site-metadata.ts'
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

const supportingPages = [
  ['/changelog', 'Changelog', 'Follow Lumen UI releases, fixes, and platform updates.', 'Releases'],
  ['/privacy', 'Privacy', 'Learn how the Lumen UI website handles data and protects visitor privacy.', 'Legal'],
  ['/support', 'Support', 'Get help with Lumen UI components, integrations, and product workflows.', 'Support'],
  ['/terms', 'Terms', 'Review the terms that apply when using the Lumen UI website and resources.', 'Legal'],
  ['/docs/brand-icons', 'Brand icons', 'Use the shared brand icon catalog across supported Lumen platforms.', 'Icons'],
  ['/docs/forms', 'Forms', 'Build accessible forms with Lumen components and framework integrations.', 'Forms'],
  ['/docs/forms/astro-actions', 'Astro Actions', 'Connect Lumen form components to type-safe Astro Actions.', 'Forms'],
  ['/docs/forms/elements', 'Web Component forms', 'Build standards-based forms with Lumen custom elements.', 'Forms'],
  ['/docs/forms/react-hook-form', 'React Hook Form', 'Connect Lumen React components to React Hook Form.', 'Forms'],
  ['/docs/foundations', 'Foundations', 'Apply Lumen semantic tokens, typography, spacing, and themes.', 'Foundations'],
  ['/docs/frameworks/astro', 'Astro', 'Use the complete Lumen component catalog in Astro applications.', 'Framework'],
  ['/docs/frameworks/elements', 'Web Components', 'Use Lumen custom elements in standards-based applications.', 'Framework'],
  ['/docs/frameworks/react', 'React', 'Use Lumen primitives and hooks in React applications.', 'Framework'],
  ['/docs/icons', 'Icons', 'Use accessible Lumen icons across product interfaces.', 'Icons'],
  ['/docs/web', 'Web platforms', 'Use one semantic Lumen contract across Astro, React, and Web Components.', 'Platform'],
  ['/docs/web/playground', 'Web playground', 'Explore Lumen web components and themes in a live playground.', 'Playground'],
  ['/docs/apple', 'Apple platforms', 'Build native Apple interfaces with Lumen SwiftUI components.', 'Platform'],
  ['/docs/apple/playground', 'Apple playground', 'Explore Lumen SwiftUI components in a native playground.', 'Playground'],
  ['/docs/android', 'Android', 'Build native Android interfaces with Lumen Compose components.', 'Platform'],
  ['/docs/android/playground', 'Android playground', 'Explore Lumen Compose components in a native playground.', 'Playground'],
  ['/docs/react-native', 'React Native', 'Build native mobile interfaces with Lumen React Native components.', 'Platform'],
  ['/docs/react-native/playground', 'React Native playground', 'Explore Lumen React Native components in a native playground.', 'Playground'],
  ...['analytics-dashboard', 'auth-onboarding', 'commerce-dashboard', 'project-workspace', 'saas-admin'].map(slug => [
    `/templates/${slug}`,
    slug.split('-').map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' '),
    'Start from a complete, accessible Lumen product template.',
    'Template'
  ])
]

const nativePages = (['react-native', 'apple', 'android']).flatMap(platform => [
  page(`/docs/${platform}/components`, `${platform} components`, `Browse Lumen components for ${platform}.`, 'Components'),
  ...getNativeComponentsForPlatform(platform).map(component => page(
    `/docs/${platform}/components/${component.slug}`,
    component.name,
    component.summary,
    component.category
  ))
])

const pages = [
  ...Object.values(primaryPageMetadata).map(metadata => page(
    metadata.pathname,
    metadata.title,
    metadata.description,
    metadata.badge
  )),
  page('/templates', 'Product-ready templates. Free and open source.', 'Install complete analytics, SaaS, commerce, workspace, and onboarding experiences.', 'Templates'),
  page('/guides', 'Start with a product problem.', 'Task-oriented tutorials for accessible, production-shaped workflows.', 'Guides'),
  page('/guides/ship-a-settings-screen', 'Ship an accessible settings screen.', 'Build and verify a responsive account settings surface in every supported framework.', 'Guide'),
  page('/community', 'Made with Lumen.', 'Explore projects built with Lumen, share your work, and shape the roadmap.', 'Community'),
  page('/teams', 'Prove the system before you commit.', 'Evaluate Lumen with a real product surface, real constraints, and no sales gate.', 'For teams'),
  page('/docs/ai-skill', 'Give your AI the design system.', 'Install the portable skill so coding agents select and verify real Lumen components.', 'AI skill'),
  page('/docs/mcp', 'Real component contracts for AI agents.', 'Connect agents to structured components, tokens, recipes, and usage rules.', 'MCP server'),
  page('/docs/figma', 'One product language from design to code.', 'Use semantic variables, component variants, and Code Connect mappings.', 'Figma'),
  page('/docs/theme-playground', 'Build a theme from semantic roles.', 'Tune color roles, preview accessible components, and export the resulting CSS.', 'Theme playground'),
  ...supportingPages.map(([pathname, title, description, badge]) => page(pathname, title, description, badge)),
  ...nativePages,
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
    brand: {
      domain: 'lumen.santi020k.com',
      logo: 'public/icon.svg',
      name: 'Lumen UI'
    },
    decoration: (_data, _context, { accent, theme }) => `
      <g transform="translate(790 164)">
        <circle cx="94" cy="86" r="122" fill="${accent}" opacity="0.11"/>
        <circle cx="304" cy="96" r="142" fill="#0fa6a0" opacity="0.10"/>
        <rect x="20" y="34" width="300" height="300" rx="40" fill="${theme.panel}" stroke="${theme.foreground}" stroke-opacity="0.16"/>
        <rect x="54" y="72" width="126" height="48" rx="14" fill="${accent}" opacity="0.16"/>
        <rect x="70" y="88" width="58" height="16" rx="8" fill="${accent}" opacity="0.82"/>
        <rect x="54" y="148" width="232" height="18" rx="9" fill="${theme.foreground}" opacity="0.70"/>
        <rect x="54" y="188" width="190" height="13" rx="6.5" fill="${theme.foreground}" opacity="0.34"/>
        <rect x="54" y="221" width="216" height="13" rx="6.5" fill="${theme.foreground}" opacity="0.24"/>
        <rect x="54" y="270" width="112" height="34" rx="17" fill="${accent}" opacity="0.86"/>
      </g>`,
    theme: {
      accent: '#620ae6',
      background: '#faf9fb',
      foreground: '#332e38',
      muted: '#5b5463',
      panel: '#f5f3f7'
    },
    variant: 'docs'
  },
  root
})
