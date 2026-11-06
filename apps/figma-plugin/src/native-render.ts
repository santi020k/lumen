import type { NativeNode } from './native-design.js'
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

const reactNative = (root: NativeNode, fields: number, checks: readonly boolean[]) => {
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

        return `<LumenButton intent="${node.intent}" size="${node.size}" loading={${node.loading}} disabled={${node.disabled}} onPress={() => { /* Connect action */ }}>${expr(node.label)}</LumenButton>`

      case 'badge':
        foundation.add('LumenBadge')

        return `<LumenBadge tone="${node.tone}">${expr(node.label)}</LumenBadge>`

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

  const body = render(root)
  const view = foundation.has('useLumenTheme')

  const imports = [
    ...(fields || checks.length ? ['import { useState } from \'react\''] : []),
    ...(view ? ['import { View } from \'react-native\''] : []),
    ...(foundation.size ? [`import { ${[...foundation].sort().join(', ')} } from '@santi020k/lumen-react-native/foundations'`] : []),
    ...(extra.size ? [`import { ${[...extra].sort().join(', ')} } from '@santi020k/lumen-react-native'`] : [])
  ]

  const statements = [
    view ? 'const { spacing } = useLumenTheme()' : '',
    fieldStates(fields, i => `const [field${i}, setField${i}] = useState('')`),
    ...checks.map((checked, i) => `const [checked${i + 1}, setChecked${i + 1}] = useState(${checked})`),
    ...errors,
    `return (\n${indent(body)}\n)`
  ].filter(Boolean)

  return imports.join('\n') + '\n\n' + (errors.length ? `const emailPattern = new RegExp(${literal('^' + emailPattern + '$', 'tsx')})\n\n` : '') + block('export function LumenSelection()', statements.join('\n')) + '\n'
}

const swiftEdge = { top: 'top', end: 'trailing', bottom: 'bottom', start: 'leading' }

const swift = (root: NativeNode, fields: number, checks: readonly boolean[]) => {
  const errors: string[] = []
  const q = (text: string) => `.verbatim(${literal(text, 'swift')})`

  const renderInput = (node: Extract<NativeNode, { kind: 'input' }>) => {
    const field = `field${node.index}`
    const error = node.emailError ? `, errorMessage: ${field}Error` : ''

    if (node.emailError) errors.push(`let ${field}Error: LumenTextContent? = !${field}.isEmpty && (${field}.utf8.count > 254 || ${field}.wholeMatch(of: #/${emailPattern}/#) == nil) ? ${q(node.emailError)} : nil`)

    const control = `LumenTextField(${q(node.placeholder)}, text: $field${node.index}, size: .${node.size}${error})\n  .accessibilityLabel(Text(verbatim: ${literal(node.label, 'swift')}))`

    if (!node.visibleLabel) return control

    return block(`LumenFieldGroup(${q(node.label)}${node.helper ? `, description: ${q(node.helper)}` : ''}${error})`, control)
  }

  const render = (node: NativeNode): string => {
    switch (node.kind) {
      case 'text': return `LumenText(${q(node.content)}, variant: .${node.variant}, tone: .${node.tone})`

      case 'button': return `LumenButton(${q(node.label)}, intent: .${node.intent}, size: .${node.size}, loading: ${node.loading}, disabled: ${node.disabled}) { /* Connect action */ }`

      case 'badge': return `LumenBadge(${q(node.label)}, tone: .${node.tone})`

      case 'checkbox': return `LumenCheckbox(${literal(node.label, 'swift')}, isChecked: $checked${node.index})`

      case 'progress': return `LumenProgress(value: ${node.value}, label: ${literal(node.label, 'swift')})`

      case 'input': return renderInput(node)

      case 'card': return block(`LumenCard(variant: .${node.variant})`, block('VStack(alignment: .leading, spacing: LumenSpacing.sm)', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n')))

      case 'stack': {
        const head = node.row ? 'HStack(alignment: .top' : 'VStack(alignment: .leading'
        const body = block(`${head}, spacing: LumenSpacing.${member(node.gap)})`, node.children.map(render).join('\n'))

        return body + node.padding.map(({ side, gap }) => `\n.padding(.${swiftEdge[side]}, LumenSpacing.${member(gap)})`).join('')
      }
    }
  }

  const state = [
    fieldStates(fields, i => `@State private var field${i} = ""`),
    ...checks.map((checked, i) => `@State private var checked${i + 1} = ${checked}`)
  ].filter(Boolean).join('\n')

  const body = render(root)

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

const compose = (root: NativeNode, fields: number, checks: readonly boolean[]) => {
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

        return `LumenButton(onClick = { /* Connect action */ }, intent = LumenButtonIntent.${upper(node.intent)}, size = LumenControlSize.${upper(node.size)}, loading = ${node.loading}, enabled = ${!node.disabled}) { Text(${q(node.label)}) }`

      case 'badge': return `LumenBadge(${q(node.label)}, tone = LumenBadgeTone.${upper(node.tone)})`

      case 'checkbox': return `LumenCheckbox(label = ${q(node.label)}, checked = checked${node.index}, onCheckedChange = { checked${node.index} = it })`

      case 'progress': return `LumenProgress(value = ${node.value}f, label = ${q(node.label)})`

      case 'input': return renderInput(node)

      case 'card':
        imports.add('androidx.compose.foundation.layout.Column')

        return block(`LumenCard(variant = LumenCardVariant.${upper(node.variant)})`, block('Column', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n')))

      case 'stack': return renderStack(node, render)
    }
  }

  const body = render(root)

  if (fields || checks.length) {
    for (const symbol of ['getValue', 'setValue', 'mutableStateOf', 'saveable.rememberSaveable']) imports.add('androidx.compose.runtime.' + symbol)
  }

  const state = [
    fieldStates(fields, i => `var field${i} by rememberSaveable { mutableStateOf("") }`),
    ...checks.map((checked, i) => `var checked${i + 1} by rememberSaveable { mutableStateOf(${checked}) }`)
  ].filter(Boolean).join('\n')

  return [...imports].sort().map(name => 'import ' + name).join('\n') + (errors.length ? `\n\nprivate val emailPattern = Regex(${q(emailPattern)})` : '') + '\n\n@Composable\n' + block('fun LumenSelection()', [state, ...errors, body
  ].filter(Boolean).join('\n')) + '\n'
}

export const renderNative = (
  platform: NativePlatform, root: NativeNode, fields: number, checks: readonly boolean[]
): string => {
  if (platform === 'react-native') return reactNative(root, fields, checks)

  return platform === 'compose' ? compose(root, fields, checks) : swift(root, fields, checks)
}
