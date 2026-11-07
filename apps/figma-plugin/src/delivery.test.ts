import { reactServerComponents } from '@santi020k/lumen-core/component-delivery'
import * as serverComponents from '@santi020k/lumen-react/server'
import { expect, test } from 'vitest'

import { analyzeSelection } from './convert.js'
import { componentNode, designNode } from './fixtures.js'

test('the shared server component inventory agrees with the React server exports', () => {
  const exported = Object.entries(serverComponents)
    .filter(([, value]) => typeof value === 'function')
    .map(([name]) => name)
    .sort()
  expect([...reactServerComponents].sort()).toEqual(exported)
})

test('a static v5 Card needs no Astro runtime and uses React server exports', () => {
  const selection = componentNode('Card', { Title: 'Static card', Body: 'Static content' })
  const astro = analyzeSelection(selection, { platform: 'astro', version: '5.0.0', appearance: 'project' })
  expect(astro.layout).not.toContain('UIPrimitives')
  expect(astro.code).toContain('@santi020k/lumen-astro/components/Card')

  const react = analyzeSelection(selection, { platform: 'react', version: '5.0.0', appearance: 'project' })
  expect(react.code).not.toContain('use client')
  expect(react.code).toContain('import { Card, CardContent, CardHeader, CardTitle } from \'@santi020k/lumen-react/server\'')
  expect(react.layout).toContain('styles/components/card-title.css')
})

test('v5 compound card parts register through the shared granular entries', () => {
  const result = analyzeSelection(componentNode('Card'), { platform: 'elements', version: '5.0.0', appearance: 'project' })
  expect(result.layout).toContain('from \'@santi020k/lumen-elements/components/card\'')
  expect(result.layout).toContain('from \'@santi020k/lumen-elements/components/foundations\'')
  expect(result.layout).not.toContain('defineLumenElements')
  expect(result.layout).not.toContain('from \'@santi020k/lumen-elements\'')
  for (const part of ['card', 'card-content', 'card-header', 'card-title']) {
    expect(result.layout).toContain(`if (!customElements.get('lumen-${part}')) customElements.define('lumen-${part}',`)
  }
})

test('nested interactive selections keep the Astro runtime and React client boundary', () => {
  const selection = designNode({ children: [componentNode('Card'), componentNode('Dialog', { 'Show actions': true })] })
  const astro = analyzeSelection(selection, { platform: 'astro', version: '5.0.0', appearance: 'paper' })
  expect(astro.layout).toContain('<UIPrimitives />')
  const react = analyzeSelection(selection, { platform: 'react', version: '5.0.0', appearance: 'paper' })
  expect(react.code).toContain('\'use client\'')
  expect(react.code).toContain('onOpenChange=')
  expect(react.code).toContain('from \'@santi020k/lumen-react/components/dialog\'')
  const elements = analyzeSelection(selection, { platform: 'elements', version: '5.0.0', appearance: 'paper' })
  expect(elements.layout).not.toContain('from \'@santi020k/lumen-elements\'')
  expect(elements.layout).toContain('from \'@santi020k/lumen-elements/components/dialog\'')
})

test('a catalog fallback keeps the other v5 Elements registrations selective', () => {
  const result = analyzeSelection(designNode({ children: [componentNode('Card'), componentNode('Tabs')] }), {
    platform: 'elements', version: '5.0.0', appearance: 'project'
  })
  expect(result.layout).toContain('import { LumenTabsElement } from \'@santi020k/lumen-elements\'')
  expect(result.layout).toContain('import { LumenCardElement } from \'@santi020k/lumen-elements/components/card\'')
})

test('legacy exports retain their versioned registration and client contracts', () => {
  const selection = componentNode('Card')
  const astro = analyzeSelection(selection, { platform: 'astro', version: '4.4.0', appearance: 'project' })
  expect(astro.layout).toContain('<UIPrimitives />')
  const react = analyzeSelection(selection, { platform: 'react', version: '4.4.0', appearance: 'project' })
  expect(react.code).toContain('\'use client\'')
  expect(react.code).toContain('from \'@santi020k/lumen-react\'')
  const elements = analyzeSelection(selection, { platform: 'elements', version: '4.4.0', appearance: 'project' })
  expect(elements.layout).toContain('defineLumenElements()')
  expect(elements.layout).toContain('/styles.css')
})
