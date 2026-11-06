import { describe, expect, test } from 'vitest'

import { analyzeSelection } from './convert.js'
import { caption, control, copy, frame, onboardingFixture, track } from './fixtures.js'
import type { DesignNode } from './model.js'
import { defaultFor } from './targets.js'

describe.each(['react-native', 'compose', 'swiftui-ios', 'swiftui-macos'] as const)('%s template controls', platform => {
  const exportNode = (node: DesignNode) => analyzeSelection(node, defaultFor(platform))

  test('exports labeled, independently editable fields, toggle state and determinate progress', () => {
    const { code, findings } = exportNode(onboardingFixture)
    for (const name of ['Workspace name', 'Work email', 'Enter a complete email address.', 'Send updates', 'Send reminders', 'Setup progress']) expect(code).toContain(name)
    expect(code.match(/LumenTextField(?: |\()/gu)).toHaveLength(2)
    expect(code).toContain('field1')
    expect(code).toContain('field2')
    expect(code).toMatch(/checked1[^\n]*(?:true|True)/u)
    expect(code).toMatch(/checked2[^\n]*(?:false|False)/u)
    expect(code.match(/LumenCheckbox(?: |\()/gu)).toHaveLength(2)
    expect(code).toMatch(/LumenProgress(?: |\()[^\n]*50/u)
    expect(findings.some(f => f.status === 'inferred' && f.message.includes('visible percentage'))).toBe(true)
    expect(findings.some(f => f.status === 'unsupported')).toBe(false)
  })

  test('leaves unrelated text and untrusted controls intact and never invents progress', () => {
    const fake = { ...control('Checkbox', { Checked: 'True' }), component: { name: 'Checkbox', key: 'copy', setKey: null } }
    expect(exportNode(frame('Checkbox', fake, copy('Keep this text'))).code).not.toContain('LumenCheckbox')
    expect(exportNode(frame('Checkbox', control('Checkbox', { Checked: 'Mixed' }), copy('Keep this text'))).code).toContain('Keep this text')
    for (const value of ['101%', '-5%', '50% or 90%', 'half', '50']) {
      const result = exportNode(frame('Progress', caption(value), track))
      expect(result.code).not.toContain('LumenProgress')
      expect(result.code).toContain(value)
    }
    expect(exportNode(frame('Frame', caption('50%'), frame('unrelated'))).code).not.toContain('LumenProgress')
    for (const value of ['0', '100']) expect(exportNode(control('Progress', { Value: value })).code).toContain('LumenProgress')
    expect(exportNode(control('Progress', { Value: '500' })).code).toBe('')
  })
})
