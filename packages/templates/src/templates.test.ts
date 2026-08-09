import { describe, expect, test } from 'vitest'

import {
  getLumenTemplate,
  getTemplateInstallCommand,
  isTemplateSlug,
  lumenTemplates,
  templateFrameworks,
  templateSlugs
} from './templates'

describe('Lumen templates catalog', () => {
  test('publishes every planned template family for all targets', () => {
    expect(lumenTemplates.map(template => template.slug)).toEqual(templateSlugs)

    for (const template of lumenTemplates) {
      expect(template.frameworks).toEqual(templateFrameworks)
      expect(template.description.length).toBeGreaterThan(40)
    }
  })

  test('resolves template metadata and install commands', () => {
    expect(isTemplateSlug('analytics-dashboard')).toBe(true)
    expect(isTemplateSlug('unknown-template')).toBe(false)
    expect(getLumenTemplate('project-workspace')?.name).toBe('Project workspace')
    expect(getLumenTemplate('unknown-template')).toBeUndefined()
    expect(getTemplateInstallCommand('saas-admin', 'react'))
      .toBe('pnpm exec lumen add saas-admin --target react')
  })
})
