import type { AuditedPage } from '@santi020k/og/audit'
import { expect, test } from 'vitest'

import { getSocialCardMetadata } from './social-cards'

const page = (pathname: string, title = 'Button for SwiftUI - Lumen UI'): AuditedPage => ({
  alternates: [],
  canonical: `https://lumen.santi020k.com${pathname}`,
  description: 'Build an accessible button with native usage and API guidance.',
  file: 'index.html',
  indexable: true,
  route: `${pathname}/`,
  schemaTypes: ['WebPage'],
  title
})

test('uses canonical routes and final descriptions while keeping branding out of card headings', () => {
  const metadata = getSocialCardMetadata(page('/docs/apple/components/button'))

  expect(metadata.pathname).toBe('/docs/apple/components/button')
  expect(metadata.title).toBe('Button for SwiftUI - Lumen UI')
  expect(metadata.cardTitle).toBe('Button for SwiftUI')
  expect(metadata.badge).toBe('SwiftUI')
  expect(metadata.description).toBe(page('/').description)
  expect(metadata.alt).toContain('SwiftUI')
})

test('selects section visuals for chart and agent guides and labels each native platform', () => {
  expect(getSocialCardMetadata(page('/docs/web/data-visualization/data')).eyebrow).toBe('Charts & reporting')
  expect(getSocialCardMetadata(page('/docs/mcp/reference')).eyebrow).toBe('AI & developer tools')
  expect(getSocialCardMetadata(page('/docs/android/components/button')).badge).toBe('Android / Compose')
  expect(getSocialCardMetadata(page('/docs/react-native/components/button')).badge).toBe('React Native')
  expect(getSocialCardMetadata(page('/templates/saas-admin', 'SaaS Admin — Lumen templates')).cardTitle).toBe('SaaS Admin')
})

test('fails generation when a public page has incomplete metadata', () => {
  expect(() => getSocialCardMetadata({ ...page('/docs'), description: '' })).toThrow('Missing social-card metadata')
  expect(() => getSocialCardMetadata({ ...page('/docs'), title: '' })).toThrow('Missing social-card metadata')
  const missingCanonical = page('/docs')

  delete missingCanonical.canonical

  expect(() => getSocialCardMetadata(missingCanonical)).toThrow('Missing social-card metadata')
})
