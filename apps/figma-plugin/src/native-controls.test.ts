import { describe, expect, test } from 'vitest'

import { analyzeSelection } from './convert.js'
import { caption, control, copy, emailField, frame, onboardingFixture, track } from './fixtures.js'
import type { DesignNode } from './model.js'
import { emailPattern } from './native-render.js'
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

  test('binds one alert to the email value and preserves unrecognized alerts as copy', () => {
    const { code, findings } = exportNode(onboardingFixture)

    expect(code).toContain('field2Error')
    expect(code).not.toContain('field1Error')
    expect(code.split('Enter a complete email address.')).toHaveLength(2)
    expect(findings.some(f => f.status === 'inferred' && f.message.includes('email format'))).toBe(true)

    const [label, input, alert, outline] = emailField.children
    if (!label || !input || !alert || !outline) throw new Error('Incomplete fixture')

    for (const node of [
      frame('Field', label, input, alert),
      frame('Field', label, input, alert, { ...outline, tokens: [] }),
      frame('Field', label, input, frame('Alert', ...alert.children, copy('Also read this')), outline),
      frame('Field', label, { ...input, component: null }, alert, outline)
    ]) {
      const result = exportNode(node)
      expect(result.code).not.toContain('emailPattern')
      expect(result.code).toContain('Enter a complete email address.')
    }
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

test('accepts common mailbox punctuation and requires complete domain labels', () => {
  const pattern = new RegExp('^' + emailPattern + '$', 'u')

  for (const value of ['o\'brien+qa@sub.example.test', 'qa.team@my-team.test', 'a@b.co']) expect(pattern.test(value)).toBe(true)
  for (const value of ['qa@example', 'qa@@example.test', 'qa @example.test', 'a..b@example.test', 'a@.example.test', 'a@example.test.', 'a@-team.test', 'a@team-.test']) expect(pattern.test(value)).toBe(false)
})
