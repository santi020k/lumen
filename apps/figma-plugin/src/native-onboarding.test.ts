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

  test('exports both directions, a required-field guard and one shared preference across steps', () => {
    const { code, findings } = analyze(form)

    expect(findings.some(f => f.status === 'inferred' && f.message.includes('Workspace and Preferences'))).toBe(true)
    expect(code).toMatch(/(?:setShowPreferences\(true\)|showPreferences = true)/u)
    expect(code).toMatch(/(?:setShowPreferences\(false\)|showPreferences = false)/u)
    expect(code).toMatch(/canContinue = .*field1.*field2.*field2Error/u)
    expect(code).toContain('Step 3 of 4')
    expect(code).toContain('75%')
    expect(code.match(/LumenCheckbox(?: |\()[^\n]*checked1/gu)).toHaveLength(2)
    expect(code).not.toContain('Connect action')
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
      expect(analyze(other).code).not.toContain('showPreferences')
    }
  })
})
