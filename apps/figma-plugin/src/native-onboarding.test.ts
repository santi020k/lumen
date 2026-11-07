import { describe, expect, test } from 'vitest'

import { analyzeSelection } from './convert.js'
import { componentNode, frame, onboardingFixture } from './fixtures.js'
import type { DesignNode } from './model.js'
import { defaultFor } from './targets.js'

const sourcePart = (name: string) => {
  const node = onboardingFixture.children.find(child => child.name === name)

  if (!node) throw new Error('Missing test control ' + name)

  return node
}

const [workspace, email] = onboardingFixture.children

if (!workspace || !email) throw new Error('Missing test fields')

const parts = [workspace,
  email,
  sourcePart('Onboarding choices'),
  { ...sourcePart('Options'), name: 'Onboarding checkbox' },
  { ...sourcePart('Setup'), name: 'Onboarding progress' }]
const button = (label: string) => componentNode('Button', { Label: label, Variant: label === 'Back' ? 'Ghost' : 'Default', Size: 'Default' })
const actions = frame('Onboarding actions', button('Back'), frame('Button / Continue', button('Continue')))
const form = frame('Onboarding form', ...parts, actions)

describe.each(['react-native', 'compose', 'swiftui-ios', 'swiftui-macos'] as const)('%s onboarding navigation', platform => {
  const analyze = (node: DesignNode) => analyzeSelection(node, defaultFor(platform))

  test('exports both round trips with a guard on Workspace and a shared preference', () => {
    const { code, findings } = analyze(form)

    expect(findings.some(f => f.status === 'inferred' && f.message.includes('Workspace, Preferences and Invite'))).toBe(true)
    const actions = code.split('\n').filter(line => line.includes('LumenButton'))
    const actionsAt = (step: number) => actions.filter(line => line.includes(`setOnboardingStep(${step})`) || line.includes(`onboardingStep = ${step} `))
    expect(actionsAt(4)).toEqual([expect.stringContaining('Continue')])
    expect(actionsAt(3)).toHaveLength(2)
    expect(actionsAt(3)).toEqual(expect.arrayContaining([expect.stringContaining('Continue'), expect.stringContaining('Back')]))
    expect(actionsAt(2).every(line => line.includes('Back'))).toBe(true)
    // Only forward navigation from Workspace is gated. Invite can always return to Preferences.
    const buttons = code.split('\n').filter(line => line.includes('LumenButton') && line.includes('canContinue'))
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toContain('Continue')
    expect(code).toContain('Step 4 of 4')
    expect(code).toContain('"Invite"')
    expect(code).toContain('100%')
    expect(code).toMatch(/canContinue = .*field1.*field2.*field2Error/u)
    expect(code).toContain('Step 3 of 4')
    expect(code).toContain('75%')
    expect(code.match(/LumenCheckbox(?: |\()[^\n]*checked1/gu)).toHaveLength(2)
    expect(code).not.toContain('Connect action')
  })

  test('keeps the teammate email in its own draft field outside the Invite step', () => {
    const { code } = analyze(form)
    const inviteStart = code.indexOf('"Step 4 of 4"')
    const draft = code.slice(0, code.indexOf('canContinue ='))
    const invite = code.slice(inviteStart, code.indexOf('"100%"', inviteStart))

    expect(draft).toMatch(/(?:\[field3, setField3\] = useState|var field3 (?:=|by rememberSaveable))/u)
    expect(invite).toContain('"Teammate email"')
    const binding = {
      'react-native': 'value={field3} onChangeText={setField3}',
      compose: 'value = field3, onValueChange = { field3 = it }',
      'swiftui-ios': 'text: $field3',
      'swiftui-macos': 'text: $field3'
    }
    expect(invite).toContain(binding[platform])
    expect(invite).not.toContain('field2')
  })

  test('validates the teammate address independently and connects its live hint', () => {
    const { code } = analyze(form)
    const error = code.split('\n').find(line => /(?:const|let|val) field3Error/u.test(line))
    const binding = {
      'react-native': 'errorMessage={field3Error}',
      compose: 'errorMessage = field3Error',
      'swiftui-ios': 'errorMessage: field3Error.map(LumenTextContent.verbatim)',
      'swiftui-macos': 'errorMessage: field3Error.map(LumenTextContent.verbatim)'
    }

    expect(error).toContain('Enter a complete email address, such as teammate@example.com.')
    expect(error).toMatch(/field3(?:\.length > 0|\.isNotEmpty\(\)|\.isEmpty)/u)
    expect(error).toContain('254')
    expect(error).not.toContain('field2')
    expect(code.slice(code.indexOf('"Step 4 of 4"'))).toContain(binding[platform])
    expect(code.split('\n').find(line => line.includes('canContinue ='))).not.toContain('field3')
  })

  test('does not assign navigation to generic, incomplete or ambiguous selections', () => {
    const fakeNext = { ...button('Continue'), component: { key: 'foreign', name: 'Button', setKey: null } }
    for (const other of [
      { ...form, name: 'Billing form' },
      actions,
      frame('Onboarding form', ...parts.slice(1), actions),
      frame('Onboarding form', ...parts, frame('Onboarding actions', button('Back'), fakeNext)),
      frame('Onboarding form', ...parts, frame('Onboarding actions', button('Back'), button('Next'), button('Continue')))
    ]) {
      expect(analyze(other).code).not.toContain('onboardingStep')
    }
  })
})
