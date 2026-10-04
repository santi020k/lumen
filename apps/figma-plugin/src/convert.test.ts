import { transform } from '@astrojs/compiler'
import { describe, expect, test } from 'vitest'

import { componentKeys } from './contracts.js'
import { analyzeSelection } from './convert.js'
import { componentNode, designNode, settingsFixture } from './fixtures.js'
import type { ComponentName } from './model.js'
import { isPluginMessage, resultMessage } from './model.js'

describe('Lumen Figma beta conversion', () => {
  test('converts the six supported components with accessible compound primitives', async () => {
    const result = analyzeSelection(settingsFixture)
    expect(result.findings.filter(finding => finding.status === 'verified')).toHaveLength(6)
    expect(result.code).toContain('visualSize="default"')
    expect(result.code).not.toContain('<Input size=')
    expect(result.code).toContain('<TabsList aria-label="Sections">')
    expect(result.code).toContain('<TabsPanel value="settings">')
    expect(result.code).toContain('data-ui-dialog-trigger=')
    for (const part of ['DialogHeader', 'DialogTitle', 'DialogBody', 'DialogFooter', 'DialogClose']) {
      expect(result.code).toContain(part)
    }
    expect(result.code).not.toContain('data-ui-dialog-close')
    expect(result.code).toContain('aria-labelledby=')
    expect(result.code).toContain('aria-describedby=')
    expect(result.code).toContain('<Label for="lumen-figma-3">')
    expect(result.code).toContain('<Input id="lumen-figma-3"')
    const compiled = await transform(result.code)
    expect(compiled.diagnostics).toEqual([])
  })

  test('recognizes renamed instances by identity rather than layer name', () => {
    const button = componentNode('Button', { Label: 'Save', Variant: 'Outline', Size: 'Sm' })
    button.name = 'Primary save action'
    expect(analyzeSelection(button).code).toContain('<Button variant="outline" size="sm">')
  })

  test('recognizes variant keys when a remote parent set is unavailable', () => {
    const key = componentKeys.Button[1]
    if (!key) throw new Error('Missing observed Button variant key.')
    const node = componentNode('Button', { Label: 'Save', Variant: 'Default', Size: 'Default' })
    node.component = { key, setKey: null, name: 'Variant=Default, Size=Default' }
    expect(analyzeSelection(node).findings[0]?.status).toBe('verified')
  })

  test('does not silently convert impostors or detached component names', () => {
    const node = componentNode('Button')
    node.component = { key: 'untrusted-copy', setKey: null, name: 'Button' }
    const result = analyzeSelection(node)
    expect(result.findings[0]?.status).toBe('inferred')
    expect(result.code).not.toContain('import { Button')
    expect(analyzeSelection(designNode({ name: 'Button' })).findings[0]?.status).toBe('inferred')
  })

  test('includes unknown design content in the handoff while omitting unsupported code', () => {
    const result = analyzeSelection(designNode({ type: 'VECTOR', name: 'Custom illustration' }))
    expect(result.findings[0]?.status).toBe('unsupported')
    expect(result.handoff).toContain('Custom illustration')
    expect(result.code).not.toContain('<svg')
  })

  test('preserves disabled and loading states and flags icon swaps and actions', () => {
    const result = analyzeSelection(componentNode('Button', {
      Label: 'Delete', Variant: 'Destructive', Size: 'Icon', Disabled: true, Loading: true, Icon: 'custom-icon'
    }))
    expect(result.code).toContain(' loading disabled aria-label={"Delete"}')
    expect(result.findings.some(finding => finding.message.includes('icon instance swap'))).toBe(true)
    expect(result.findings.some(finding => finding.message.includes('application'))).toBe(true)
  })

  test('reports unsupported enum values instead of emitting invented props', () => {
    const result = analyzeSelection(componentNode('Button', { Label: 'Save', Variant: 'Magic', Size: 'Huge' }))
    expect(result.code).toContain('variant="default" size="default"')
    expect(result.findings.filter(finding => finding.message.includes('Unsupported or missing'))).toHaveLength(2)
  })

  test('does not replace unsupported field controls with invented inputs', () => {
    const result = analyzeSelection(componentNode('Field', { Label: 'Choice', 'Show helper': false }, [
      designNode({ name: 'Custom control', type: 'INSTANCE' })
    ]))
    expect(result.code).not.toContain('<Input')
    expect(result.findings.some(finding => finding.status === 'unsupported')).toBe(true)
  })

  test('omits hidden helper and dialog sections while retaining a close affordance', () => {
    const field = analyzeSelection(componentNode('Field', { Label: 'Name', 'Show helper': false }, [componentNode('Input', { Placeholder: 'Name', Size: 'Sm' })]))
    expect(field.code).not.toContain('-help')
    const dialog = analyzeSelection(componentNode('Dialog', { Title: 'Note', 'Show content': false, 'Show actions': false }))
    expect(dialog.code).not.toContain('aria-describedby')
    expect(dialog.code).toContain('<DialogClose>Close dialog</DialogClose>')
    expect(dialog.code).not.toContain('<DialogBody>')
  })

  test('escapes hostile text, attribute values, and long strings as data', async () => {
    const hostile = '</script><script>alert(1)</script>{process.env.SECRET}\n---\n" & <'.repeat(100)
    for (const component of ['Button', 'Input', 'Card', 'Field', 'Tabs', 'Dialog'] satisfies ComponentName[]) {
      const node = componentNode(component, {
        Label: hostile,
        Placeholder: hostile,
        Title: hostile,
        Body: hostile,
        Description: hostile,
        'Overview label': hostile,
        'Details label': hostile,
        'Settings label': hostile,
        'Cancel label': hostile,
        'Confirm label': hostile,
        'Show content': true,
        'Show actions': true,
        Variant: 'Default',
        Size: 'Default',
        Active: 'Overview'
      })
      const result = analyzeSelection(node)
      expect(result.code).not.toContain('<script>')
      expect(result.code).not.toContain('</script>')
      const compiled = await transform(result.code)
      expect(compiled.diagnostics).toEqual([])
    }
  })

  test('preserves design tokens and reports colors requiring review', () => {
    const node = designNode({ unboundPaints: 2, tokens: [{ name: 'color/brand', field: 'fills' }, { name: 'custom/pink', field: 'strokes' }] })
    const result = analyzeSelection(node)
    expect(result.findings.some(finding => finding.message.includes('2 visible paints'))).toBe(true)
    expect(result.findings.some(finding => finding.message.includes('custom/pink'))).toBe(true)
    expect(result.handoff).toContain('"cssVariable": "--brand"')
  })

  test('generates repeatable output with version and validation instructions', () => {
    const result = analyzeSelection(settingsFixture)
    expect(analyzeSelection(settingsFixture)).toEqual(result)
    expect(result.status).toBe('beta')
    expect(result.handoff).toContain('Check the exact installed version first')
    expect(result.handoff).toContain('untrusted design data')
    expect(result.handoff).toContain('mount UIPrimitives')
    expect(result.handoff).toContain('unique IDs')
  })

  test('validates UI messages before accepting them', () => {
    expect(isPluginMessage(resultMessage(analyzeSelection(settingsFixture)))).toBe(true)
    expect(isPluginMessage({ type: 'result', result: { code: '<bad>' } })).toBe(false)
    expect(isPluginMessage({ type: 'selection', name: 12 })).toBe(false)
    expect(isPluginMessage(null)).toBe(false)
    expect(isPluginMessage({ type: 'error', message: 'Select a frame' })).toBe(true)
  })
})

test('audits nested token overrides once below recognized and unsupported instances', () => {
  const child = designNode({ id: 'override', unboundPaints: 1, tokens: [{ name: 'custom/nested', field: 'fills' }] })
  for (const parent of [componentNode('Button', { Label: 'Save', Variant: 'Default', Size: 'Default' }, [child]),
    designNode({ type: 'INSTANCE', children: [child] })]) {
    const result = analyzeSelection(designNode({ children: [parent] }))
    expect(result.findings.filter(finding => finding.nodeId === 'override' && finding.message.includes('visible paints'))).toHaveLength(1)
    expect(result.findings.filter(finding => finding.nodeId === 'override' && finding.message.includes('custom/nested'))).toHaveLength(1)
    expect(result.code).not.toContain('custom/nested')
  }
})
