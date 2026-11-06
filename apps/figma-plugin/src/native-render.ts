import type { NativeNode } from './native-design.js'
import type { OnboardingFlow } from './native-onboarding.js'
import type { NativePlatform } from './targets.js'

const indent = (lines: string) => lines.split('\n').map(line => '  ' + line).join('\n')
const block = (head: string, body: string) => `${head} {\n${indent(body)}\n}`
const jsx = (head: string, name: string, body: string) => `<${head}>\n${indent(body)}\n</${name}>`
const upper = (name: string) => name.charAt(0).toUpperCase() + name.slice(1)
const member = (gap: string) => gap.endsWith('xl') && gap.length === 3 ? `size${gap}` : gap
// Source literals, never identifiers, comments, raw strings or interpolated expressions.
const escapes = new Map([['"', '\\"'], ['\\', '\\\\'], ['\n', '\\n'], ['\r', '\\r'], ['\t', '\\t']])

const escapedPoint = (n: number) => n < 32 || (n >= 127 && n <= 159) ||
  (n >= 0x2028 && n <= 0x202e) || (n >= 0x2066 && n <= 0x2069)

const literal = (value: string, language: 'swift' | 'kotlin' | 'tsx'): string => {
  const encode = (char: string) => {
    const escaped = escapes.get(char)

    if (escaped) return escaped

    if (language === 'kotlin' && char === '$') return '\\$'

    const point = char.codePointAt(0) ?? 0

    if (escapedPoint(point)) {
      const hex = point.toString(16)

      return language === 'swift' ? `\\u{${hex}}` : `\\u${hex.padStart(4, '0')}`
    }

    return point >= 0xd800 && point <= 0xdfff ? '\ufffd' : char
  }

  return '"' + Array.from(value, encode).join('') + '"'
}

const textNode = (content: string, variant: 'body' | 'title'): NativeNode => ({ kind: 'text', content, variant, tone: 'default' })
const fieldStates = (count: number, line: (index: number) => string) => Array.from({ length: count }, (_, i) => line(i + 1)).join('\n')
// The same dot-atom and dotted host rule in all three languages. Bound work on pasted input.
const atom = '[A-Za-z0-9!#$%&\'*+/=?^_`{|}~-]+'
const domainLabel = '[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?'

export const emailPattern = `${atom}(?:[.]${atom})*@${domainLabel}(?:[.]${domainLabel})+`

interface NativeState {
  fields: number
  checks: readonly boolean[]
  choices: readonly string[]
}

const hasState = ({ fields, checks, choices }: NativeState) => fields > 0 || checks.length > 0 || choices.length > 0

type Button = Extract<NativeNode, { kind: 'button' }>

const buttonAction = (button: Button, platform: 'tsx' | 'native') => {
  if (!button.destinationStep) return '/* Connect action */'

  return platform === 'tsx' ? `setOnboardingStep(${button.destinationStep})` : `onboardingStep = ${button.destinationStep}`
}

const buttonDisabled = (button: Button) => {
  if (button.disabled) return 'true'

  return button.requiresWorkspace ? '!canContinue' : 'false'
}

const buttonEnabled = (button: Button) => {
  if (button.disabled) return 'false'

  return button.requiresWorkspace ? 'canContinue' : 'true'
}

type RenderNode = (node: NativeNode) => string

const renderPages = (root: NativeNode, flow: OnboardingFlow | null, render: RenderNode, platform: NativePlatform) => {
  const workspace = render(root)
  const returnView = (view: string) => `return (\n${indent(view)}\n)`

  if (!flow) return platform === 'react-native' ? returnView(workspace) : workspace

  const preferences = render(flow.preferences)
  const invite = render(flow.invite)

  if (platform === 'react-native') {
    return block('switch (onboardingStep)', [
      'case 3:',
      indent(returnView(preferences)),
      'case 4:',
      indent(returnView(invite)),
      'default:',
      indent(returnView(workspace))
    ].join('\n'))
  }

  if (platform === 'compose') {
    return block('when (onboardingStep)', [block('3 ->', preferences), block('4 ->', invite), block('else ->', workspace)].join('\n'))
  }

  return block('switch onboardingStep', [
    'case 3:', indent(preferences), 'case 4:', indent(invite), 'default:', indent(workspace)
  ].join('\n'))
}

const reactNative = (root: NativeNode, state: NativeState, flow: OnboardingFlow | null) => {
  const { fields, checks, choices } = state
  const foundation = new Set<string>()
  const extra = new Set<string>()
  const errors: string[] = []
  const expr = (value: string) => `{${literal(value, 'tsx')}}`

  const renderStack = (node: Extract<NativeNode, { kind: 'stack' }>, render: (child: NativeNode) => string) => {
    foundation.add('useLumenTheme')

    const properties = [node.row ? 'flexDirection: \'row\'' : 'flexDirection: \'column\'', `gap: spacing['${node.gap}']`]

    if (node.wrap) properties.push('flexWrap: \'wrap\'')

    for (const { gap, side } of node.padding) properties.push(`padding${upper(side)}: spacing['${gap}']`)

    return jsx(`View style={{ ${properties.join(', ')} }}`, 'View', node.children.map(render).join('\n'))
  }

  const renderInput = (node: Extract<NativeNode, { kind: 'input' }>) => {
    foundation.add('LumenTextField')

    const control = `<LumenTextField ${node.visibleLabel ? '' : `accessibilityLabel=${expr(node.label)} `}placeholder=${expr(node.placeholder)} size="${node.size}" value={field${node.index}} onChangeText={setField${node.index}} />`

    if (!node.visibleLabel) return control

    extra.add('LumenFieldGroup')

    const field = `field${node.index}`

    if (node.emailError) errors.push(`const ${field}Error = ${field}.length > 0 && (${field}.length > 254 || !emailPattern.test(${field})) ? ${literal(node.emailError, 'tsx')} : ''`)

    return jsx(`LumenFieldGroup${node.emailError ? ` errorMessage={${field}Error}` : ''} label=${expr(node.label)}${node.helper ? ` description=${expr(node.helper)}` : ''}`, 'LumenFieldGroup', control)
  }

  const render = (node: NativeNode): string => {
    switch (node.kind) {
      case 'text':
        foundation.add('LumenText')

        return `<LumenText variant="${node.variant}" tone="${node.tone}">${expr(node.content)}</LumenText>`

      case 'button':
        foundation.add('LumenButton')

        return `<LumenButton intent="${node.intent}" size="${node.size}" loading={${node.loading}} disabled={${buttonDisabled(node)}} onPress={() => { ${buttonAction(node, 'tsx')} }}>${expr(node.label)}</LumenButton>`

      case 'badge':
        foundation.add('LumenBadge')

        return `<LumenBadge tone="${node.tone}">${expr(node.label)}</LumenBadge>`

      case 'radioGroup': {
        extra.add('LumenRadioGroup')

        const options = node.options.map(option => `{ value: ${literal(option.value, 'tsx')}, label: ${literal(option.label, 'tsx')}, description: ${literal(option.description, 'tsx')} }`)

        return `<LumenRadioGroup label=${expr(node.label)} value={choice${node.index}} onValueChange={setChoice${node.index}} options={[\n${indent(options.join(',\n'))}\n]} />`
      }

      case 'checkbox':
        extra.add('LumenCheckbox')

        return `<LumenCheckbox label=${expr(node.label)} checked={checked${node.index}} onCheckedChange={setChecked${node.index}} />`

      case 'progress':
        extra.add('LumenProgress')

        return `<LumenProgress label=${expr(node.label)} value={${node.value}} />`

      case 'input': return renderInput(node)

      case 'card':
        extra.add('LumenCard')

        return jsx(`LumenCard variant="${node.variant}"`, 'LumenCard', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n'))

      case 'stack': return renderStack(node, render)
    }
  }

  const body = renderPages(root, flow, render, 'react-native')
  const view = foundation.has('useLumenTheme')

  const imports = [
    ...(hasState(state) ? ['import { useState } from \'react\''] : []),
    ...(view ? ['import { View } from \'react-native\''] : []),
    ...(foundation.size ? [`import { ${[...foundation].sort().join(', ')} } from '@santi020k/lumen-react-native/foundations'`] : []),
    ...(extra.size ? [`import { ${[...extra].sort().join(', ')} } from '@santi020k/lumen-react-native'`] : [])
  ]

  const statements = [
    view ? 'const { spacing } = useLumenTheme()' : '',
    fieldStates(fields, i => `const [field${i}, setField${i}] = useState('')`),
    ...checks.map((checked, i) => `const [checked${i + 1}, setChecked${i + 1}] = useState(${checked})`),
    ...choices.map((value, i) => `const [choice${i + 1}, setChoice${i + 1}] = useState(${literal(value, 'tsx')})`),
    ...(flow ? ['const [onboardingStep, setOnboardingStep] = useState(2)'] : []),
    ...errors,
    ...(flow ? [`const canContinue = field${flow.workspaceField}.trim().length > 0 && field${flow.emailField}.length > 0 && !field${flow.emailField}Error`] : []),
    body
  ].filter(Boolean)

  return imports.join('\n') + '\n\n' + (errors.length ? `const emailPattern = new RegExp(${literal('^' + emailPattern + '$', 'tsx')})\n\n` : '') + block('export function LumenSelection()', statements.join('\n')) + '\n'
}

const swiftEdge = { top: 'top', end: 'trailing', bottom: 'bottom', start: 'leading' }

const swift = (root: NativeNode, { fields, checks, choices }: NativeState, flow: OnboardingFlow | null) => {
  const errors: string[] = []
  const q = (text: string) => `.verbatim(${literal(text, 'swift')})`

  const renderInput = (node: Extract<NativeNode, { kind: 'input' }>) => {
    const field = `field${node.index}`
    const error = node.emailError ? `, errorMessage: ${field}Error.map(LumenTextContent.verbatim)` : ''

    if (node.emailError) errors.push(`let ${field}Error: String? = !${field}.isEmpty && (${field}.utf8.count > 254 || ${field}.wholeMatch(of: #/${emailPattern}/#) == nil) ? ${literal(node.emailError, 'swift')} : nil`)

    // Keep the TextField's identity across validation changes so typing never loses focus.
    const hint = node.emailError ? `\n  .accessibilityHint(Text(verbatim: ${field}Error ?? ""))` : ''
    const control = `LumenTextField(${q(node.placeholder)}, text: $field${node.index}, size: .${node.size})\n  .accessibilityLabel(Text(verbatim: ${literal(node.label, 'swift')}))${hint}`

    if (!node.visibleLabel) return control

    return block(`LumenFieldGroup(${q(node.label)}${node.helper ? `, description: ${q(node.helper)}` : ''}${error})`, control)
  }

  const renderStack = (node: Extract<NativeNode, { kind: 'stack' }>, render: (child: NativeNode) => string) => {
    const head = node.row ? 'HStack(alignment: .top' : 'VStack(alignment: .leading'
    const body = block(`${head}, spacing: LumenSpacing.${member(node.gap)})`, node.children.map(render).join('\n'))

    return body + node.padding.map(({ side, gap }) => `\n.padding(.${swiftEdge[side]}, LumenSpacing.${member(gap)})`).join('')
  }

  const render = (node: NativeNode): string => {
    switch (node.kind) {
      case 'text': return `LumenText(${q(node.content)}, variant: .${node.variant}, tone: .${node.tone})`

      case 'button': return `LumenButton(${q(node.label)}, intent: .${node.intent}, size: .${node.size}, loading: ${node.loading}, disabled: ${buttonDisabled(node)}) { ${buttonAction(node, 'native')} }`

      case 'badge': return `LumenBadge(${q(node.label)}, tone: .${node.tone})`

      case 'radioGroup': {
        const options = node.options.map(option => `LumenSelectionOption(${literal(option.label, 'swift')}, value: ${literal(option.value, 'swift')}, description: ${literal(option.description, 'swift')})`)

        return `LumenRadioGroup(${literal(node.label, 'swift')}, selection: $choice${node.index}, options: [\n${indent(options.join(',\n'))}\n])`
      }

      case 'checkbox': return `LumenCheckbox(${literal(node.label, 'swift')}, isChecked: $checked${node.index})`

      case 'progress': return `LumenProgress(value: ${node.value}, label: ${literal(node.label, 'swift')})`

      case 'input': return renderInput(node)

      case 'card': return block(`LumenCard(variant: .${node.variant})`, block('VStack(alignment: .leading, spacing: LumenSpacing.sm)', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n')))

      case 'stack': return renderStack(node, render)
    }
  }

  const state = [
    flow ? '@State private var onboardingStep = 2' : '',
    fieldStates(fields, i => `@State private var field${i} = ""`),
    ...checks.map((checked, i) => `@State private var checked${i + 1} = ${checked}`),
    ...choices.map((value, i) => `@State private var choice${i + 1} = ${literal(value, 'swift')}`)
  ].filter(Boolean).join('\n')

  const body = renderPages(root, flow, render, 'swiftui-ios')

  if (flow) errors.push(`let canContinue = !field${flow.workspaceField}.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !field${flow.emailField}.isEmpty && field${flow.emailField}Error == nil`)

  return 'import SwiftUI\nimport LumenUI\n\n' + block('struct LumenSelection: View', [state, block('var body: some View', [...errors, body].join('\n'))].filter(Boolean).join('\n\n')) + '\n'
}

// A JVM constant is limited to 65,535 modified UTF-8 bytes. Preserve long layer text
// as runtime-joined constants, without splitting a Unicode scalar between chunks.
const kotlinString = (value: string) => {
  if (value.length <= 16_000) return literal(value, 'kotlin')

  const chunks: string[] = []
  let chunk = ''

  for (const char of value) {
    chunk += char

    if (chunk.length >= 16_000) {
      chunks.push(literal(chunk, 'kotlin'))

      chunk = ''
    }
  }

  if (chunk) chunks.push(literal(chunk, 'kotlin'))

  return 'listOf(' + chunks.join(', ') + ').joinToString("")'
}

const compose = (root: NativeNode, form: NativeState, flow: OnboardingFlow | null) => {
  const { fields, checks, choices } = form
  const errors: string[] = []
  const q = kotlinString
  const imports = new Set(['androidx.compose.runtime.Composable', 'com.santi020k.lumen.*'])

  const renderStack = (node: Extract<NativeNode, { kind: 'stack' }>, render: (child: NativeNode) => string) => {
    const head = node.row ? 'Row' : 'Column'

    imports.add('androidx.compose.foundation.layout.' + head)

    imports.add('androidx.compose.foundation.layout.Arrangement')

    const args = [`${node.row ? 'horizontal' : 'vertical'}Arrangement = Arrangement.spacedBy(LumenSpacing.${upper(member(node.gap))})`]

    if (node.padding.length) {
      imports.add('androidx.compose.foundation.layout.padding')

      imports.add('androidx.compose.ui.Modifier')

      args.push(`modifier = Modifier.padding(${node.padding.map(({ gap, side }) => `${side} = LumenSpacing.${upper(member(gap))}`).join(', ')})`)
    }

    return block(`${head}(${args.join(', ')})`, node.children.map(render).join('\n'))
  }

  const renderInput = (node: Extract<NativeNode, { kind: 'input' }>) => {
    const field = `field${node.index}`

    if (node.emailError) errors.push(`val ${field}Error = if (${field}.isNotEmpty() && (${field}.length > 254 || !emailPattern.matches(${field}))) ${q(node.emailError)} else null`)

    const control = `LumenTextField(value = field${node.index}, onValueChange = { field${node.index} = it }, label = ${q(node.label)}, size = LumenControlSize.${upper(node.size)}${node.emailError ? `, errorMessage = ${field}Error` : ''})`

    if (!node.helper) return control

    imports.add('androidx.compose.foundation.layout.Column')

    return block('Column', control + '\n' + `LumenText(${q(node.helper)}, variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)`)
  }

  const render = (node: NativeNode): string => {
    switch (node.kind) {
      case 'text': return `LumenText(${q(node.content)}, variant = LumenTextVariant.${upper(node.variant)}, tone = LumenTextTone.${upper(node.tone)})`

      case 'button':
        imports.add('androidx.compose.material3.Text')

        return `LumenButton(onClick = { ${buttonAction(node, 'native')} }, intent = LumenButtonIntent.${upper(node.intent)}, size = LumenControlSize.${upper(node.size)}, loading = ${node.loading}, enabled = ${buttonEnabled(node)}) { Text(${q(node.label)}) }`

      case 'badge': return `LumenBadge(${q(node.label)}, tone = LumenBadgeTone.${upper(node.tone)})`

      case 'radioGroup': {
        const options = node.options.map(option => `LumenSelectionOption(value = ${q(option.value)}, label = ${q(option.label)}, description = ${q(option.description)})`)

        return `LumenRadioGroup(label = ${q(node.label)}, value = choice${node.index}, onValueChange = { choice${node.index} = it }, options = listOf(\n${indent(options.join(',\n'))}\n))`
      }

      case 'checkbox': return `LumenCheckbox(label = ${q(node.label)}, checked = checked${node.index}, onCheckedChange = { checked${node.index} = it })`

      case 'progress': return `LumenProgress(value = ${node.value}f, label = ${q(node.label)})`

      case 'input': return renderInput(node)

      case 'card':
        imports.add('androidx.compose.foundation.layout.Column')

        return block(`LumenCard(variant = LumenCardVariant.${upper(node.variant)})`, block('Column', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n')))

      case 'stack': return renderStack(node, render)
    }
  }

  const body = renderPages(root, flow, render, 'compose')

  if (hasState(form)) {
    for (const symbol of ['getValue', 'setValue', 'mutableStateOf', 'saveable.rememberSaveable']) imports.add('androidx.compose.runtime.' + symbol)
  }

  const state = [
    flow ? 'var onboardingStep by rememberSaveable { mutableStateOf(2) }' : '',
    fieldStates(fields, i => `var field${i} by rememberSaveable { mutableStateOf("") }`),
    ...checks.map((checked, i) => `var checked${i + 1} by rememberSaveable { mutableStateOf(${checked}) }`),
    ...choices.map((value, i) => `var choice${i + 1} by rememberSaveable { mutableStateOf(${q(value)}) }`)
  ].filter(Boolean).join('\n')

  if (flow) errors.push(`val canContinue = field${flow.workspaceField}.isNotBlank() && field${flow.emailField}.isNotEmpty() && field${flow.emailField}Error == null`)

  return [...imports].sort().map(name => 'import ' + name).join('\n') + (errors.length ? `\n\nprivate val emailPattern = Regex(${q(emailPattern)})` : '') + '\n\n@Composable\n' + block('fun LumenSelection()', [state, ...errors, body
  ].filter(Boolean).join('\n')) + '\n'
}

export const renderNative = (
  platform: NativePlatform, root: NativeNode, state: NativeState, flow: OnboardingFlow | null
): string => {
  if (platform === 'react-native') return reactNative(root, state, flow)

  return platform === 'compose' ? compose(root, state, flow) : swift(root, state, flow)
}
