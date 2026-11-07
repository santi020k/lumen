import { describe, expect, test } from 'vitest'

import { analyzeSelection } from './convert.js'
import { choiceCard, copy, frame, workspaceLegend } from './fixtures.js'
import { drawnChoiceGroup } from './native-choices.js'
import { defaultFor } from './targets.js'

const card = (selected: boolean) => choiceCard('Same display title', 'A description', selected)
const choices = (...states: boolean[]) => frame('Choices', workspaceLegend, ...states.map(card))

test('reads selection from the design and assigns separate values even to duplicate titles', () => {
  const group = drawnChoiceGroup(choices(false, true))

  expect(group?.initial).toBe('option-2')
  expect(group?.options.map(option => option.value)).toEqual(['option-1', 'option-2'])
})

test('keeps ambiguous, incomplete and unverified cards as ordinary content', () => {
  const ambiguous = frame('Choices', workspaceLegend, card(true), frame('Label', copy('Unrelated copy')))
  const foreign = { ...card(false), type: 'INSTANCE', component: { key: 'other', setKey: null, name: 'Other' } }
  for (const node of [choices(true), choices(false, false), choices(true, true), ambiguous, frame('Choices', workspaceLegend, card(true), foreign)]) {
    expect(drawnChoiceGroup(node)).toBeNull()
    const { code } = analyzeSelection(node, defaultFor('react-native'))
    expect(code).not.toContain('LumenRadioGroup')
    expect(code).toContain('Same display title')
  }
})

describe.each(['react-native', 'compose', 'swiftui-ios', 'swiftui-macos'] as const)('%s choice groups', platform => {
  test('emits independent single-selection controls with the design labels and descriptions', () => {
    const result = analyzeSelection(frame('Two groups', choices(false, true), choices(true, false)), defaultFor(platform))
    expect(result.code.match(/(?:<LumenRadioGroup |LumenRadioGroup\()/gu)).toHaveLength(2)
    expect(result.code).toMatch(/choice1[^\n]*"option-2"/u)
    expect(result.code).toMatch(/choice2[^\n]*"option-1"/u)
    expect(result.code).toContain('What are you setting up?')
    expect(result.code).toContain('A description')
    expect(result.findings.some(finding => finding.status === 'inferred' && finding.message.includes('radio group'))).toBe(true)
  })
})
