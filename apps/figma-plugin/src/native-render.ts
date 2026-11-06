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

const reactNative = (root: NativeNode, fields: number) => {
  const foundation = new Set<string>()
  const extra = new Set<string>()
  const expr = (value: string) => `{${literal(value, 'tsx')}}`

  const renderStack = (node: Extract<NativeNode, { kind: 'stack' }>, render: (child: NativeNode) => string) => {
    foundation.add('useLumenTheme')

    const properties = [node.row ? 'flexDirection: \'row\'' : 'flexDirection: \'column\'', `gap: spacing['${node.gap}']`]

    if (node.wrap) properties.push('flexWrap: \'wrap\'')

    for (const { gap, side } of node.padding) properties.push(`padding${upper(side)}: spacing['${gap}']`)

    return jsx(`View style={{ ${properties.join(', ')} }}`, 'View', node.children.map(render).join('\n'))
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

      case 'input': {
        foundation.add('LumenTextField')

        const control = `<LumenTextField ${node.visibleLabel ? '' : `accessibilityLabel=${expr(node.label)} `}placeholder=${expr(node.placeholder)} size="${node.size}" value={field${node.index}} onChangeText={setField${node.index}} />`

        if (!node.visibleLabel) return control

        extra.add('LumenFieldGroup')

        return jsx(`LumenFieldGroup label=${expr(node.label)}${node.helper ? ` description=${expr(node.helper)}` : ''}`, 'LumenFieldGroup', control)
      }

      case 'card':
        extra.add('LumenCard')

        return jsx(`LumenCard variant="${node.variant}"`, 'LumenCard', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n'))

      case 'stack': return renderStack(node, render)
    }
  }

  const body = render(root)
  const view = foundation.has('useLumenTheme')

  const imports = [
    ...(fields ? ['import { useState } from \'react\''] : []),
    ...(view ? ['import { View } from \'react-native\''] : []),
    ...(foundation.size ? [`import { ${[...foundation].sort().join(', ')} } from '@santi020k/lumen-react-native/foundations'`] : []),
    ...(extra.size ? [`import { ${[...extra].sort().join(', ')} } from '@santi020k/lumen-react-native'`] : [])
  ]

  const statements = [view ? 'const { spacing } = useLumenTheme()' : '', fieldStates(fields, i => `const [field${i}, setField${i}] = useState('')`), `return (\n${indent(body)}\n)`].filter(Boolean)

  return imports.join('\n') + '\n\n' + block('export function LumenSelection()', statements.join('\n')) + '\n'
}

const swiftEdge = { top: 'top', end: 'trailing', bottom: 'bottom', start: 'leading' }

const swift = (root: NativeNode, fields: number) => {
  const q = (text: string) => `.verbatim(${literal(text, 'swift')})`

  const render = (node: NativeNode): string => {
    switch (node.kind) {
      case 'text': return `LumenText(${q(node.content)}, variant: .${node.variant}, tone: .${node.tone})`

      case 'button': return `LumenButton(${q(node.label)}, intent: .${node.intent}, size: .${node.size}, loading: ${node.loading}, disabled: ${node.disabled}) { /* Connect action */ }`

      case 'badge': return `LumenBadge(${q(node.label)}, tone: .${node.tone})`

      case 'input': {
        const control = `LumenTextField(${q(node.placeholder)}, text: $field${node.index}, size: .${node.size})\n  .accessibilityLabel(Text(verbatim: ${literal(node.label, 'swift')}))`

        if (!node.visibleLabel) return control

        return block(`LumenFieldGroup(${q(node.label)}${node.helper ? `, description: ${q(node.helper)}` : ''})`, control)
      }

      case 'card': return block(`LumenCard(variant: .${node.variant})`, block('VStack(alignment: .leading, spacing: LumenSpacing.sm)', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n')))

      case 'stack': {
        const head = node.row ? 'HStack(alignment: .top' : 'VStack(alignment: .leading'
        const body = block(`${head}, spacing: LumenSpacing.${member(node.gap)})`, node.children.map(render).join('\n'))

        return body + node.padding.map(({ side, gap }) => `\n.padding(.${swiftEdge[side]}, LumenSpacing.${member(gap)})`).join('')
      }
    }
  }

  const state = fieldStates(fields, i => `@State private var field${i} = ""`)

  return 'import SwiftUI\nimport LumenUI\n\n' + block('struct LumenSelection: View', [state, block('var body: some View', render(root))].filter(Boolean).join('\n\n')) + '\n'
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

const compose = (root: NativeNode, fields: number) => {
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

  const render = (node: NativeNode): string => {
    switch (node.kind) {
      case 'text': return `LumenText(${q(node.content)}, variant = LumenTextVariant.${upper(node.variant)}, tone = LumenTextTone.${upper(node.tone)})`

      case 'button':
        imports.add('androidx.compose.material3.Text')

        return `LumenButton(onClick = { /* Connect action */ }, intent = LumenButtonIntent.${upper(node.intent)}, size = LumenControlSize.${upper(node.size)}, loading = ${node.loading}, enabled = ${!node.disabled}) { Text(${q(node.label)}) }`

      case 'badge': return `LumenBadge(${q(node.label)}, tone = LumenBadgeTone.${upper(node.tone)})`

      case 'input': {
        const control = `LumenTextField(value = field${node.index}, onValueChange = { field${node.index} = it }, label = ${q(node.label)}, size = LumenControlSize.${upper(node.size)})`

        if (!node.helper) return control

        imports.add('androidx.compose.foundation.layout.Column')

        return block('Column', control + '\n' + `LumenText(${q(node.helper)}, variant = LumenTextVariant.Caption, tone = LumenTextTone.Muted)`)
      }

      case 'card':
        imports.add('androidx.compose.foundation.layout.Column')

        return block(`LumenCard(variant = LumenCardVariant.${upper(node.variant)})`, block('Column', [textNode(node.title, 'title'), textNode(node.body, 'body')].map(render).join('\n')))

      case 'stack': return renderStack(node, render)
    }
  }

  const body = render(root)

  if (fields) {
    for (const symbol of ['getValue', 'setValue', 'mutableStateOf', 'saveable.rememberSaveable']) imports.add('androidx.compose.runtime.' + symbol)
  }

  const state = fieldStates(fields, i => `var field${i} by rememberSaveable { mutableStateOf("") }`)

  return [...imports].sort().map(name => 'import ' + name).join('\n') + '\n\n@Composable\n' + block('fun LumenSelection()', [state, body].filter(Boolean).join('\n')) + '\n'
}

export const renderNative = (platform: NativePlatform, root: NativeNode, fields: number): string => {
  if (platform === 'react-native') return reactNative(root, fields)

  return platform === 'compose' ? compose(root, fields) : swift(root, fields)
}
