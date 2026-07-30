export const templateFrameworks = ['astro', 'react', 'elements'] as const

export type TemplateFramework = typeof templateFrameworks[number]

export const templateSlugs = [
  'analytics-dashboard',
  'saas-admin',
  'commerce-dashboard',
  'project-workspace',
  'auth-onboarding'
] as const

export type TemplateSlug = typeof templateSlugs[number]

export interface LumenTemplate {
  description: string
  eyebrow: string
  frameworks: readonly TemplateFramework[]
  icon: string
  name: string
  slug: TemplateSlug
}

export const lumenTemplates = [
  {
    description: 'Revenue, acquisition, and retention signals arranged for fast weekly decisions.',
    eyebrow: 'Growth intelligence',
    frameworks: templateFrameworks,
    icon: 'chart-no-axes-combined',
    name: 'Analytics dashboard',
    slug: 'analytics-dashboard'
  },
  {
    description: 'Users, roles, billing health, and operational controls for a growing SaaS product.',
    eyebrow: 'Workspace operations',
    frameworks: templateFrameworks,
    icon: 'users-round',
    name: 'SaaS administration',
    slug: 'saas-admin'
  },
  {
    description: 'Orders, inventory, revenue, and fulfillment health in one commerce command center.',
    eyebrow: 'Commerce operations',
    frameworks: templateFrameworks,
    icon: 'shopping-bag',
    name: 'Commerce dashboard',
    slug: 'commerce-dashboard'
  },
  {
    description: 'Projects, milestones, workload, and team activity for delivery-focused teams.',
    eyebrow: 'Team delivery',
    frameworks: templateFrameworks,
    icon: 'folder-kanban',
    name: 'Project workspace',
    slug: 'project-workspace'
  },
  {
    description: 'A calm sign-in and guided setup flow with useful validation and progress states.',
    eyebrow: 'First-run experience',
    frameworks: templateFrameworks,
    icon: 'sparkles',
    name: 'Authentication and onboarding',
    slug: 'auth-onboarding'
  }
] as const satisfies readonly LumenTemplate[]

export const isTemplateSlug = (value: string): value is TemplateSlug => {
  const matches = templateSlugs.some(slug => slug === value)

  return matches
}

export const getLumenTemplate = (slug: string): LumenTemplate | undefined => {
  const template = lumenTemplates.find(item => item.slug === slug)

  return template
}

export const getTemplateInstallCommand = (
  slug: TemplateSlug,
  framework: TemplateFramework
): string => (
  `pnpm exec lumen add ${slug} --target ${framework}`
)
