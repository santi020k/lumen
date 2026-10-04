import { expect, test } from 'vitest'

import { getDocsBreadcrumbs } from './docs-breadcrumbs'

test('preserves explicit breadcrumb contracts, including an intentionally empty list', () => {
  const explicit = [{ href: '/docs/web', label: 'Web platform' }]

  expect(getDocsBreadcrumbs('/docs/frameworks/astro', 'Astro - Lumen UI', explicit)).toBe(explicit)
  expect(getDocsBreadcrumbs('/docs/frameworks/astro', 'Astro - Lumen UI', [])).toEqual([])
})

test('uses Web as the framework parent without inventing a frameworks index', () => {
  const breadcrumbs = getDocsBreadcrumbs('/docs/frameworks/astro', 'Astro - Lumen UI')

  expect(breadcrumbs).toEqual([
    { href: '/docs', label: 'Documentation' },
    { href: '/docs/web', label: 'Web' },
    { href: '/docs/frameworks/astro', label: 'Astro' }
  ])
  expect(breadcrumbs.some(item => item.href === '/docs/frameworks')).toBe(false)
})

test('includes the real Forms index and strips the site suffix from the current page', () => {
  expect(getDocsBreadcrumbs('/docs/forms/react-hook-form/', 'React Hook Form — Lumen UI')).toEqual([
    { href: '/docs', label: 'Documentation' },
    { href: '/docs/web', label: 'Web' },
    { href: '/docs/forms', label: 'Forms' },
    { href: '/docs/forms/react-hook-form', label: 'React Hook Form' }
  ])
})

test('includes platform and component ancestors for native references', () => {
  const breadcrumbs = getDocsBreadcrumbs('/docs/apple/components/button', 'Button for SwiftUI - Lumen UI')

  expect(breadcrumbs.map(item => item.href)).toEqual([
    '/docs', '/docs/apple', '/docs/apple/components', '/docs/apple/components/button'
  ])
  expect(breadcrumbs.at(-1)?.label).toBe('Button for SwiftUI')
})

test('reuses the visualization directory as the parent of focused chart guides', () => {
  expect(getDocsBreadcrumbs('/docs/web/data-visualization/accessibility', 'Accessible charts — Lumen UI')
    .map(item => item.href)).toEqual([
    '/docs', '/docs/web', '/docs/web/data-visualization', '/docs/web/data-visualization/accessibility'
  ])
})

test('keeps shared documentation routes independent of platform routes', () => {
  expect(getDocsBreadcrumbs('/docs/migrations/v3-to-v4', 'Lumen 3 to Lumen 4 migration - Lumen UI')).toEqual([
    { href: '/docs', label: 'Documentation' },
    { href: '/docs/migrations', label: 'Migration guides' },
    { href: '/docs/migrations/v3-to-v4', label: 'Lumen 3 to Lumen 4 migration' }
  ])
  expect(getDocsBreadcrumbs('/docs', 'Documentation - Lumen UI')).toEqual([
    { href: '/docs', label: 'Documentation' }
  ])
})
