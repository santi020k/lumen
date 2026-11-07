import { transform } from '@astrojs/compiler'
import { describe, expect, test } from 'vitest'

import type { ComponentName } from './contracts.js'
import { componentKeys } from './contracts.js'
import { analyzeSelection } from './convert.js'
import { componentNode, designNode, editorialFixture, settingsFixture } from './fixtures.js'
import { isPluginMessage, resultMessage } from './model.js'
import { appearancesFor, defaultFor, isPlatform, layoutFor, platforms, supportsAppearance, versions } from './targets.js'

describe('Lumen Figma conversion', () => {
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

  test('keeps linked inputs in ordinary Field frames without treating the frame or a copied instance as a Field', () => {
    const input = componentNode('Input', { Size: 'Default', Placeholder: 'Team name' })
    input.id = 'linked-input'
    const wrapper = designNode({ name: 'Field', children: [input] })
    const copied = componentNode('Field', {}, [input])
    copied.component = { name: 'Field', key: 'copy', setKey: null }
    for (const platform of Object.keys(platforms)) {
      if (!isPlatform(platform)) throw new Error('Expected an export target.')
      const target = defaultFor(platform)
      const plain = analyzeSelection(wrapper, target)
      expect(plain.code).toContain('Team name')
      expect(plain.findings.filter(finding => finding.status === 'verified').map(finding => finding.nodeId)).toEqual(['linked-input'])
      expect(plain.findings.some(finding => finding.status === 'inferred' && finding.nodeId === wrapper.id)).toBe(true)
      expect(analyzeSelection(copied, target).code).not.toContain('Team name')
    }
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
    expect(result.status).toBe('stable')
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

describe('versioned Astro exports', () => {
  test.each(versions)('maps the editorial library using public %s components', async version => {
    const result = analyzeSelection(editorialFixture, { version, appearance: 'studio' })
    expect(result.findings.filter(finding => finding.status === 'verified')).toHaveLength(15)
    expect(result.code).toContain('<Badge variant="success">{"Ready"}</Badge>')
    expect(result.code).toContain('<Code variant="block" code={"pnpm install"} wrap />')
    expect(result.code).toContain('<TimelineItem>')
    expect(result.code).toContain('initialValue="npm" copy={true} wrap={true}')
    expect(result.code).toContain('animation="slide-up" duration="fast" delay={10} stagger={40} threshold={0.25} once={false}')
    expect(result.code).toContain('<Kbd>{"Enter"}</Kbd>')
    expect(result.code).toContain('<li>{"Verify"}</li>')
    expect(result.code).toContain('<Note borderPosition="right"')
    expect(result.handoff).toContain(result.layout)
    expect(result.handoff).toContain(`"lumenVersion": "${version}"`)
    expect((await transform(result.code)).diagnostics).toEqual([])
  })

  test('loads only the styles and component entries supported by each target', () => {
    const current = analyzeSelection(editorialFixture, { version: '5.0.0', appearance: 'studio' })
    const legacy = analyzeSelection(editorialFixture, { version: '4.4.0', appearance: 'studio' })
    expect(current.code).toContain('import TimelineItem from \'@santi020k/lumen-astro/components/TimelineItem\'')
    expect(current.layout).toContain('/styles/themes/studio.css')
    expect(current.layout).not.toContain('/styles.css')
    const paper = analyzeSelection(editorialFixture, { version: '5.0.0', appearance: 'paper' })
    expect(paper.code).toContain('appearance="editorial"')
    expect(legacy.code).not.toContain('/components/')
    expect(legacy.layout).toContain('/styles.css')
    expect(legacy.layout).not.toContain('/themes/')
    expect(current.handoff).toContain('lumen add article-reading')
    expect(current.handoff).toContain('lumen add code-example')
    expect(legacy.handoff).not.toContain('lumen add')
  })

  test('only offers appearances implemented by the selected release', () => {
    expect(appearancesFor('4.4.0').map(option => option.value)).not.toContain('paper')
    expect(supportsAppearance('4.4.0', 'field')).toBe(false)
    expect(supportsAppearance('5.0.0', 'paper')).toBe(true)
    expect(supportsAppearance('5.0.0', 'constructor')).toBe(false)
    expect(layoutFor({ version: '5.0.0', appearance: 'glass' })).toContain('/styles/effects/glass.css')
    expect(layoutFor({ version: '5.0.0', appearance: 'project' })).not.toContain('.css')
    const branded = analyzeSelection(componentNode('ThemeToggle'), { version: '5.0.0', appearance: 'santi020k-dark' })
    expect(branded.layout).toContain('data-theme="santi020k-dark"')
    expect(branded.code).toContain('lightTheme="santi020k-light" darkTheme="santi020k-dark"')
  })

  test('preserves code line breaks and excludes filename and language layers', () => {
    const code = analyzeSelection(componentNode('Code', { Variant: 'Block', Wrap: 'Off' }, [
      designNode({ type: 'TEXT', name: 'TS', text: 'TypeScript' }),
      designNode({ type: 'TEXT', name: 'Line', text: 'first("value")' }),
      designNode({ type: 'TEXT', name: 'Line', text: 'second()' })
    ])).code
    expect(code).toContain(JSON.stringify('first("value")\nsecond()'))
    expect(code).not.toContain('TypeScript')
  })

  test('escapes code examples and rejects invalid reveal timing', async () => {
    const hostile = '</script>{import.meta.env}'
    const code = analyzeSelection(componentNode('CodeTabs', { 'Npm code': hostile })).code
    expect(code).not.toContain('</script>')
    expect((await transform(code)).diagnostics).toEqual([])
    const result = analyzeSelection(componentNode('RevealGroup', { Delay: hostile, Threshold: '2', Stagger: 'Infinity' }))
    expect(result.code).toContain('delay={0} stagger={80} threshold={0.15}')
    expect(result.findings.some(finding => finding.message.includes('Review Threshold'))).toBe(true)
  })
})
