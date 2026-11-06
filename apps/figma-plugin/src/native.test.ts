import { describe, expect, test } from 'vitest'

import manifest from '../../../registry/release-manifest.json'

import { analyzeSelection } from './convert.js'
import { componentNode, designNode, nativeFixture } from './fixtures.js'
import { isPluginMessage, resultMessage } from './model.js'
import { defaultFor, readTarget } from './targets.js'

const targets = ['react-native', 'compose', 'swiftui-ios', 'swiftui-macos'] as const

test('uses adapter contracts rather than the umbrella version', () => {
  expect(defaultFor('react-native').version).toBe(manifest.release.npm.packages['@santi020k/lumen-react-native'].version)
  expect(defaultFor('compose').version).toBe(manifest.release.compose.version)
  for (const apple of ['swiftui-ios', 'swiftui-macos'] as const) expect('v' + defaultFor(apple).version).toBe(manifest.release.swift.tag)
  for (const [platform, version, appearance] of [['compose', '5.0.0', 'project'], ['swiftui-macos', '4.1.0', 'project'], ['swiftui-ios', '5.0.0', 'glass'], ['watchos', '5.0.0', 'project']]) {
    expect(readTarget(platform, version, appearance)).toBeNull()
  }
})

test('exports long Kotlin text without exceeding the JVM string constant limit', () => {
  const content = '界'.repeat(24_000)
  const { code } = analyzeSelection(designNode({ type: 'TEXT', text: content }), defaultFor('compose'))
  expect(code).toContain('listOf("' + content.slice(0, 16_000) + '", "' + content.slice(16_000) + '").joinToString("")')
})

describe.each(targets)('%s native export', platform => {
  const target = defaultFor(platform)

  test('keeps the selected target, independent editable controls, literal text, and only supported native components', () => {
    const result = analyzeSelection(nativeFixture, target)
    expect(result.target).toBe(platform)
    expect(isPluginMessage(resultMessage(result))).toBe(true)
    expect(result.code).toContain('LumenButton')
    expect(result.code).toContain('LumenBadge')
    expect(result.code).toContain('Workspace name')
    expect(result.code).toContain('field1')
    expect(result.code).toContain('field2')
    expect(result.code).not.toMatch(/UIPrimitives|lumen-astro|<Tabs|LumenDialog/u)
    expect(result.findings.filter(f => f.status === 'unsupported').map(f => f.name)).toEqual(['Tabs', 'Dialog'])
    expect(result.handoff).toContain('Untrusted design context')
    expect(result.handoff).toContain('Archive workspace')
    expect(result.code).not.toContain('Archive workspace')
    expect(result.code).toContain(platform === 'compose' ? '\\${amount}' : '${amount}')
    expect(result.code).toContain('\\\\(value)')
  })

  test('never exports a lookalike, an unknown field control or a wholly unsupported selection', () => {
    const impostor = componentNode('Button', { Label: 'Secret' })
    impostor.component = { name: 'Button', key: 'copy', setKey: null }
    for (const node of [impostor, componentNode('Field', {}, [impostor]), componentNode('ThemeToggle'), designNode({ children: [impostor] })]) {
      const result = analyzeSelection(node, target)
      expect(result.code).toBe('')
      expect(result.findings.some(f => f.status === 'unsupported')).toBe(true)
    }
  })

  test('uses verified key and native state even when an instance is renamed', () => {
    const action = componentNode('Button', { Label: 'Archive', Variant: 'Destructive', Size: 'Sm', Disabled: true, Loading: true })
    action.name = 'Renamed action'
    const { code, findings } = analyzeSelection(action, target)
    expect(code.toLowerCase()).toContain('danger')
    expect(code.toLowerCase()).toContain('sm')
    expect(code).toContain('Archive')
    expect(code).toMatch(/loading(?:=|: | = )\{?true/u)
    expect(code).toMatch(/disabled(?:=|: )\{?true|enabled = false/u)
    expect(findings.some(f => f.status === 'verified')).toBe(true)
  })

  test('maps known spacing and text tones and flags layout choices that need review', () => {
    const node = designNode({ layout: { direction: 'HORIZONTAL', wrap: true, gap: 32, padding: [8, 0, 17, 24] },
      children: [
        designNode({ type: 'TEXT', text: 'Ready', tokens: [{ field: 'fills', name: 'color/ink-muted' }] })
      ] })
    const { code, findings } = analyzeSelection(node, target)
    expect(code.toLowerCase()).toContain('2xl')
    expect(code.toLowerCase()).toContain('muted')
    expect(findings.some(f => f.message.includes('Spacing 17'))).toBe(true)
    expect(findings.some(f => f.message.includes('Wrapping'))).toBe(platform !== 'react-native')
  })
})
