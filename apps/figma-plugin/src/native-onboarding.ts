import type { DesignNode } from './model.js'
import type { NativeNode } from './native-design.js'

type Button = Extract<NativeNode, { kind: 'button' }>

type Stack = Extract<NativeNode, { kind: 'stack' }>

export interface OnboardingFlow {
  workspaceField: number
  emailField: number
  preferences: Stack
}

const leaves = (node: NativeNode): NativeNode[] => node.kind === 'stack' ? node.children.flatMap(leaves) : [node]

const actionPair = (group: NativeNode) => {
  const actions = leaves(group)
  const [back, next] = actions

  if (actions.length !== 2 || back?.kind !== 'button' || next?.kind !== 'button') return null

  if (back.label !== 'Back' || next.label !== 'Continue' || back.disabled || back.loading) return null

  return { back, next }
}

const text = (content: string, variant: 'label' | 'title' | 'body'): NativeNode => ({ kind: 'text', content, variant, tone: 'default' })
// The templates package identifies Workspace (2/4) and Preferences (3/4).
// Infer local navigation only for the complete selected form with its verified controls.
const formParts = ['Field', 'Field', 'Onboarding choices', 'Onboarding checkbox', 'Onboarding progress', 'Onboarding actions']

const matchesTemplate = (selection: DesignNode) => selection.name === 'Onboarding form' &&
  selection.children.length === formParts.length && selection.children.every((child, i) => child.name === formParts[i])

const onlyControl = <K extends NativeNode['kind']>(part: NativeNode | undefined, kind: K) => {
  if (!part) return null

  const controls = leaves(part).filter((node): node is Extract<NativeNode, { kind: K }> => node.kind === kind)

  return controls.length === 1 ? controls[0] : null
}

const workspaceFields = (stack: Stack) => {
  const name = onlyControl(stack.children[0], 'input')
  const email = onlyControl(stack.children[1], 'input')

  return name && !name.emailError && email?.emailError ? { workspaceField: name.index, emailField: email.index } : null
}

const preferencesControls = (root: Stack) => {
  const choices = onlyControl(root.children[2], 'radioGroup')
  const preference = onlyControl(root.children[3], 'checkbox')
  const meter = onlyControl(root.children[4], 'progress')

  return choices && preference && meter?.value === 50 ? { preference, meter } : null
}

export const bindOnboarding = (selection: DesignNode, root: NativeNode | null): OnboardingFlow | null => {
  if (!matchesTemplate(selection) || root?.kind !== 'stack' || root.children.length !== formParts.length) return null

  const fields = workspaceFields(root)
  const controls = preferencesControls(root)
  const actions = root.children[5]
  const pair = actions && actionPair(actions)

  if (!fields || !controls || !pair) return null

  const { preference, meter } = controls
  const returnButton: Button = { ...pair.back, navigation: 'workspace' }

  pair.back.disabled = true

  pair.back.navigation = 'workspace'

  pair.next.navigation = 'preferences'

  return {
    ...fields,
    preferences: { ...root,
      row: false,
      wrap: false,
      gap: 'md',
      children: [
        text('Step 3 of 4', 'label'),
        text('Preferences', 'title'),
        preference,
        text(meter.label, 'label'),
        text('75%', 'body'),
        { ...meter, value: 75 },
        returnButton
      ] }
  }
}
