import {
  existsSync,
  readFileSync,
  readdirSync
} from 'node:fs'
import { join } from 'node:path'

import { lumenComponentNames } from '../packages/core/src/components.js'
import {
  componentNameToSlug,
  componentPageNames,
  runtimeBehaviorComponentNames
} from './component-coverage.js'
import { describe, expect, test } from 'vitest'

const repositoryRoot = process.cwd()
const astroComponentsDirectory = join(repositoryRoot, 'packages/astro/components')
const examplesDirectory = join(repositoryRoot, 'apps/docs/src/examples')

describe('public component coverage', () => {
  test('gives every public component an Astro contract surface', () => {
    for (const componentName of lumenComponentNames) {
      const componentPath = join(astroComponentsDirectory, `${componentName}.astro`)

      expect(existsSync(componentPath), `${componentName} is missing its Astro component`).toBe(true)

      const source = readFileSync(componentPath, 'utf8')

      expect(source, `${componentName} must resolve public class and native attribute props`)
        .toContain('resolveLumenAstroProps')
      expect(source, `${componentName} must expose a stable ui-* class contract`)
        .toMatch(/['"`]ui-[a-z0-9_-]+/)
    }
  })

  test('gives every documented component exactly one live example and route slug', () => {
    const exampleNames = readdirSync(examplesDirectory)
      .filter(fileName => fileName.endsWith('.astro'))
      .map(fileName => fileName.replace(/\.astro$/, ''))
      .sort()

    expect(exampleNames).toEqual([...componentPageNames].sort())
    expect(new Set(componentPageNames.map(componentNameToSlug)).size)
      .toBe(componentPageNames.length)
  })

  test('runs catalog-wide accessibility and visual coverage from the shared public registry', () => {
    const accessibilitySuite = readFileSync(
      join(repositoryRoot, 'tests/a11y/component-pages.spec.ts'),
      'utf8'
    )
    const visualSuite = readFileSync(
      join(repositoryRoot, 'tests/visual/components.spec.ts'),
      'utf8'
    )

    expect(accessibilitySuite).toContain("join(process.cwd(), 'apps/docs/src/examples')")
    expect(visualSuite).toContain('componentPageNames.map(componentNameToSlug)')
  })

  test('gives every runtime-enhanced component an explicit behavior scenario', () => {
    const interactionSuite = readFileSync(
      join(repositoryRoot, 'tests/a11y/component-interactions.spec.ts'),
      'utf8'
    )

    for (const componentName of runtimeBehaviorComponentNames) {
      expect(
        interactionSuite,
        `${componentName} needs an explicit behaviorTest registration`
      ).toMatch(
        new RegExp(`behaviorTest\\(\\[[^\\]]*['"]${componentName}['"][^\\]]*\\]`)
      )
    }
  })
})
