import { describe, expect, test } from 'vitest'

import { componentOutputSchema, nativeComponentOutputSchema, recipeOutputSchema } from './contracts.js'
import { loadLumenData } from './data.js'
import { getComponent, getNativeComponent, getRecipe } from './tools.js'

describe('structured usage contracts', () => {
  test('validates all detail levels for every web and native adapter', () => {
    const data = loadLumenData()
    for (const detail of ['summary', 'usage', 'source'] as const) {
      for (const component of data.components) {
        for (const framework of ['astro', 'react', 'elements'] as const) {
          expect(componentOutputSchema.safeParse(getComponent({ detail, framework, name: component.name }).data).success, `${component.name}/${framework}/${detail}`).toBe(true)
        }
      }
      for (const component of data.nativeComponents) {
        for (const platform of ['react-native', 'swiftui', 'compose'] as const) {
          expect(nativeComponentOutputSchema.safeParse(getNativeComponent({ detail, name: component.name, platform }).data).success, `${component.name}/${platform}/${detail}`).toBe(true)
        }
      }
    }
    for (const recipe of data.recipes) {
      const result = getRecipe({ name: recipe.name }).data

      expect(recipeOutputSchema.safeParse(result).success).toBe(true)
    }
  })

  test('rejects malformed nested props and success without a component', () => {
    const result = getComponent({ framework: 'react', name: 'Button' }).data
    if (!result.component) throw new Error('Missing Button fixture')
    expect(componentOutputSchema.safeParse({ ...result, component: { ...result.component, framework: { ...result.component.framework, props: [{ name: 'disabled', optional: true, type: 42 }] } } }).success).toBe(false)
    expect(componentOutputSchema.safeParse({ found: true }).success).toBe(false)
    expect(componentOutputSchema.safeParse({ found: false, component: result.component }).success).toBe(false)
    expect(componentOutputSchema.safeParse({ found: false, message: 'Unavailable' }).success).toBe(true)
  })
})
