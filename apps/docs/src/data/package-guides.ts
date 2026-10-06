import { lumenPackages } from '@santi020k/lumen-core'

export const packageGroups = [
  { id: 'frameworks', title: 'Framework adapters', description: 'Install the adapter that matches your application.' },
  { id: 'foundations', title: 'Shared foundations', description: 'Tokens, utilities, icons, and the package entry point.' },
  { id: 'integrations', title: 'Optional integrations', description: 'Add form adapters or connect coding agents when you need them.' }
] as const

const packageGuidance: Record<string, { group: typeof packageGroups[number]['id'], href: string }> = {
  '@santi020k/lumen': { group: 'foundations', href: '/docs' },
  '@santi020k/lumen-core': { group: 'foundations', href: '/docs/foundations' },
  '@santi020k/lumen-tokens': { group: 'foundations', href: '/docs/foundations#installation' },
  '@santi020k/lumen-icons-brand': { group: 'foundations', href: '/docs/brand-icons' },
  '@santi020k/lumen-astro': { group: 'frameworks', href: '/docs/frameworks/astro' },
  '@santi020k/lumen-react': { group: 'frameworks', href: '/docs/frameworks/react' },
  '@santi020k/lumen-elements': { group: 'frameworks', href: '/docs/frameworks/elements' },
  '@santi020k/lumen-react-native': { group: 'frameworks', href: '/docs/react-native/installation' },
  '@santi020k/lumen-react-hook-form': { group: 'integrations', href: '/docs/forms/react-hook-form' },
  '@santi020k/lumen-mcp': { group: 'integrations', href: '/docs/mcp' }
}

export const packageGuides = [
  ...lumenPackages.filter(pkg => pkg.packageName.startsWith('@')).map(pkg => ({ name: pkg.name, packageName: pkg.packageName })),
  { name: 'Lumen MCP', packageName: '@santi020k/lumen-mcp' }
].map(pkg => {
  const guide = packageGuidance[pkg.packageName]

  if (!guide) throw new Error(`Missing package guidance for ${pkg.packageName}`)

  return { ...pkg, ...guide, slug: pkg.packageName.replaceAll('@santi020k/', '') }
})

export const worldMapTopics = [
  { href: '/docs/web/world-map', label: 'WorldMap guide', description: 'Explore navigation, regional views, and reusable country data.' },
  { href: '/docs/web/world-map/destinations', label: 'Destination examples', description: 'Fit highlighted countries and customize regional map themes.' },
  { href: '/docs/components/world-map', label: 'Component API', description: 'Compare Astro, React, and Elements usage and props.' }
] as const
