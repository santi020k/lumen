import { describe, expect, test } from 'vitest'

import { analyzeSelection } from './convert.js'
import { componentNode, designNode } from './fixtures.js'
import { presentationKeys } from './presentations.js'

describe('canonical v5 Figma presentations', () => {
  const savedContent = {
    Title: 'A renamed instance', Body: 'Customer override', Description: 'Review this', 'Show content': true
  }
  const outer = (
    name: keyof typeof presentationKeys,
    props: Record<string, string | boolean>,
    child = componentNode(name, savedContent)
  ) => designNode({
    name: 'User label',
    type: 'INSTANCE',
    component: { key: 'variant-key', setKey: presentationKeys[name], name: 'User label' },
    properties: props,
    children: [child]
  })

  test('maps card styling and reads exposed content from the original instance', () => {
    const output = analyzeSelection(outer('Card', { Variant: 'Glass subtle', Density: 'Compact' })).code
    expect(output).toContain('<Card glass="subtle" density="compact">')
    expect(output).toContain('Customer override')
    expect(output).toContain('A renamed instance')
  })

  test('maps fullscreen dialog properties while rejecting substituted content', () => {
    const result = analyzeSelection(outer('Dialog', { Layout: 'Fullscreen', Surface: 'Strong' }))
    expect(result.code).toContain('layout="fullscreen" glass="strong"')
    expect(result.code).toContain('Review this')
    const mismatch = analyzeSelection(outer('Dialog', {}, componentNode('Card')))
    expect(mismatch.findings.some(finding => finding.status === 'verified')).toBe(false)
  })

  test('honors the selected editorial treatment, copy labels, and target package version', () => {
    const node = componentNode('Code', {
      Variant: 'Block',
      Wrap: 'Off',
      Appearance: 'Editorial',
      Language: 'TypeScript',
      'Show scroll cue': true,
      'Show copy': true,
      'Copy label': 'Copy snippet',
      'Copied label': 'Snippet copied',
      'Error label': 'Error'
    }, [designNode({ type: 'TEXT', name: 'Line', text: 'const n = 3' })])
    const current = analyzeSelection(node).code
    expect(current).toContain('appearance="editorial" language={"TypeScript"} copy copyLabel={"Copy snippet"} copiedLabel={"Snippet copied"} errorLabel={"Error"} scrollCue')
    expect(analyzeSelection(node, { appearance: 'project', version: '4.4.0' }).code).not.toContain('appearance="editorial"')
    const plain = { ...node, properties: { ...node.properties, Appearance: 'Default', Wrap: 'On', 'Show copy': false } }
    const result = analyzeSelection(plain, { appearance: 'paper', version: '5.0.0' }).code
    expect(result).not.toContain('appearance="editorial"')
    expect(result).not.toContain('copyLabel=')
    expect(result).not.toContain('scrollCue')
  })

  test('recognizes component-owned and chart paints while retaining unknown paint findings', () => {
    const names = ['color/button/primary-bg', 'color/chart/tooltip-foreground', 'color/glass/bg', 'custom/fill']
    const result = analyzeSelection(designNode({ tokens: names.map(name => ({ name, field: 'fills' })) }))
    const unmapped = result.findings.filter(finding => finding.message.includes('no shared color mapping'))
    expect(unmapped.map(finding => finding.message)).toEqual(['Review variable custom/fill; it has no shared color mapping.'])
  })

  test('exports semantic Stack gaps and the visible Tabs indicator', () => {
    expect(analyzeSelection(componentNode('Stack', { Direction: 'Vertical', Gap: 'Section' })).code).toContain('gap="section"')
    expect(analyzeSelection(componentNode('Tabs', { Active: 'Overview', 'Show indicator': true })).code).toContain('initialValue="overview" indicator')
  })
})
