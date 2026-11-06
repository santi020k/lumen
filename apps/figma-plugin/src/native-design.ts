import type { ComponentName } from './contracts.js'
import { identifyComponent, isComponentBoundary, isLayoutLayer, namedLayoutNote, withPresentationContent } from './contracts.js'
import type { DesignNode } from './model.js'
import type { NativeChoice } from './native-choices.js'
import { drawnChoiceGroup } from './native-choices.js'
import type { NativeControl } from './native-controls.js'
import { drawnProgress, emailAlert, labelText, matchesControl, percentValue } from './native-controls.js'
import type { createReview } from './review.js'
import type { NativePlatform } from './targets.js'

// Only these observed library identities have native translations.
export const nativeComponents = ['Button', 'Card', 'Badge', 'Input', 'Field', 'Stack', 'CardTitle', 'CardDescription', 'Eyebrow', 'Label', 'Checkbox', 'Progress'] as const satisfies readonly (ComponentName | NativeControl)[]

type Size = 'sm' | 'md' | 'lg'

type Gap = 'zero' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

const sides = ['top', 'end', 'bottom', 'start'] as const

type Side = typeof sides[number]

const gaps = new Map<number, Gap>([[0, 'zero'], [4, 'xs'], [8, 'sm'], [12, 'md'], [16, 'lg'], [24, 'xl'], [32, '2xl'], [48, '3xl']])
const tones = { 'color/ink': 'default', 'color/ink-muted': 'muted', 'color/ink-soft': 'soft', 'color/success': 'success', 'color/danger': 'danger', 'color/warning': 'warning' } as const
const intents = { default: 'primary', destructive: 'danger', ghost: 'quiet', secondary: 'secondary' } as const
const badges = { default: 'accent', destructive: 'danger', secondary: 'neutral', warning: 'warning', success: 'success' } as const
const hasKey = <T extends string>(record: Record<T, unknown>, key: string): key is T => Object.hasOwn(record, key)

export type NativeNode =
  | { kind: 'stack', row: boolean, wrap: boolean, gap: Gap, padding: { side: Side, gap: Gap }[], children: NativeNode[] } |
  { kind: 'card', variant: 'muted' | 'default', title: string, body: string } |
  { kind: 'button', label: string, intent: typeof intents[keyof typeof intents], size: Size, disabled: boolean, loading: boolean, destinationStep?: 2 | 3 | 4, requiresWorkspace?: boolean } |
  { kind: 'badge', label: string, tone: typeof badges[keyof typeof badges] } |
  { kind: 'text', content: string, variant: 'title' | 'body' | 'label', tone: typeof tones[keyof typeof tones] } |
  { kind: 'radioGroup', index: number, label: string, options: NativeChoice[] } |
  { kind: 'checkbox', index: number, label: string } |
  { kind: 'progress', label: string, value: number } |
  { kind: 'input', index: number, size: Size, label: string, placeholder: string, helper: string, visibleLabel: boolean, emailError: string | undefined }

const inputChildren = (node: DesignNode): DesignNode[] => {
  if (identifyComponent(node) === 'Input') return [node]

  if (node.component || node.type === 'INSTANCE') return []

  return node.children.flatMap(inputChildren)
}

const badgeLabels = (node: DesignNode): string[] => node.type === 'TEXT' && node.name === 'Badge' && node.text !== null ? [node.text] : node.children.flatMap(badgeLabels)

type Review = ReturnType<typeof createReview>

const stackGaps = { none: 'zero', xs: 'xs', sm: 'sm', md: 'md', lg: 'lg', xl: 'xl', '2xl': '2xl', '3xl': '3xl', related: 'sm', group: 'lg', section: '2xl' } as const satisfies Record<string, Gap>
const stackGap = (name: string): Gap => hasKey(stackGaps, name) ? stackGaps[name] : 'md'

type Reader = (node: DesignNode) => NativeNode | null

export const nativeDesign = (selection: DesignNode, platform: NativePlatform, { issue, text, choice }: Review) => {
  let fields = 0
  const checks: boolean[] = []
  const choices: string[] = []

  const sizeFor = (node: DesignNode): Size => {
    const value = choice(node, 'Size', ['sm', 'default', 'lg'], 'default')

    return value === 'lg' || value === 'sm' ? value : 'md'
  }

  const verified = (node: DesignNode, name: string) => {
    issue(node, `${name} matches the canonical Lumen library.`, 'verified')

    if (node.type === 'COMPONENT_SET') issue(node, 'Exported the default variant; select an instance to export its configuration.')
  }

  const input = (node: DesignNode, fieldLabel?: string, helper = '', emailError?: string): NativeNode => {
    verified(node, 'Input')

    const placeholder = text(node, 'Placeholder', '')
    const label = fieldLabel ?? (placeholder || 'Field label')

    if (!fieldLabel) issue(node, 'Supply a visible, descriptive field label in the application.')

    if (platform === 'compose' && placeholder && label !== placeholder) issue(node, 'The Compose control accepts a label but no separate placeholder. The placeholder remains in the handoff.')

    issue(node, emailError ? 'Connect local editing state to the form.' : 'Connect local editing state to the form and supply validation.')

    return { kind: 'input', index: ++fields, size: sizeFor(node), label, placeholder, visibleLabel: Boolean(fieldLabel), helper, emailError }
  }

  const field = (node: DesignNode): NativeNode | null => {
    const controls = node.children.flatMap(inputChildren)
    const control = controls[0]

    if (controls.length !== 1 || !control) {
      issue(node, 'Field requires exactly one verified Input. Review the swapped control.', 'unsupported')

      return null
    }

    verified(node, 'Field')

    return input(control, text(node, 'Label', 'Field label'), node.properties['Show helper'] === true ? text(node, 'Helper text', '') : '')
  }

  const button = (node: DesignNode): NativeNode => {
    const variant = String(node.properties.Variant ?? '').toLowerCase()

    if (!hasKey(intents, variant)) issue(node, 'This Figma button variant has no verified native intent; using secondary.')

    if (node.properties.Icon || String(node.properties.Size).toLowerCase() === 'icon') issue(node, 'Icon swaps and icon-only sizes need a native icon and accessible name. The starter uses the label.')

    issue(node, 'Review the button action in the receiving application.')

    return { kind: 'button', intent: hasKey(intents, variant) ? intents[variant] : 'secondary', label: text(node, 'Label', 'Action'), size: sizeFor(node), loading: node.properties.Loading === true, disabled: node.properties.Disabled === true }
  }

  const badge = (node: DesignNode): NativeNode => {
    const labels = badgeLabels(node)
    const variant = String(node.properties.Variant ?? '').toLowerCase()

    if (!hasKey(badges, variant)) issue(node, 'This badge variant has no matching native tone; using neutral.')

    if (labels.length !== 1) issue(node, 'Review the badge text layers.')

    return { kind: 'badge', label: labels.join(' '), tone: hasKey(badges, variant) ? badges[variant] : 'neutral' }
  }

  const nativeText = (node: DesignNode, variant: 'label' | 'body' | 'title'): NativeNode => {
    const fills = node.tokens.filter(token => token.field === 'fills')
    const color = fills.length === 1 ? fills[0]?.name ?? '' : ''

    if (fills.length && !hasKey(tones, color)) issue(node, 'This text fill has no single native text tone; review it in the app.')

    return { kind: 'text', content: node.type !== 'TEXT' ? text(node, 'Text', '') : node.text ?? '', variant: variant, tone: hasKey(tones, color) ? tones[color] : 'default' }
  }

  const checkbox = (node: DesignNode, label?: string): NativeNode | null => {
    const checked = String(node.properties.Checked).toLowerCase()

    if (checked !== 'true' && checked !== 'false') {
      issue(node, 'Review the checkbox state before exporting.', 'unsupported')

      return null
    }

    verified(node, 'Checkbox')

    if (!label) issue(node, 'Supply a descriptive checkbox label in the application.')

    return { kind: 'checkbox', index: checks.push(checked === 'true'), label: label ?? 'Checkbox' }
  }

  const progressControl = (node: DesignNode): NativeNode | null => {
    const value = percentValue(node.properties.Value)

    if (value === null) {
      issue(node, 'Progress needs a numeric value from 0 to 100.', 'unsupported')

      return null
    }

    verified(node, 'Progress')

    return { kind: 'progress', label: 'Progress', value }
  }

  const pairedControl = (first: DesignNode, second: DesignNode | undefined, onlyPair: boolean, emailError?: string) => {
    if (!second) return null

    if (matchesControl(first, 'Label') && identifyComponent(second) === 'Input') {
      verified(first, 'Label')

      return input(second, text(first, 'Text', 'Field label'), '', emailError)
    }

    const label = onlyPair && matchesControl(first, 'Checkbox') ? labelText(second) : null

    return label ? checkbox(first, label) : null
  }

  const readChildren = (node: DesignNode, read: Reader) => {
    const children: NativeNode[] = []
    const progress = drawnProgress(node)
    const email = emailAlert(node)

    if (email) issue(email.alert, 'Inferred live email format validation from the field alert and its invalid email outline.', 'inferred')

    const content = email ? node.children.filter(n => n !== email.alert && n !== email.outline) : node.children
    const siblings = content.entries()

    for (const [i, child] of siblings) {
      const pair = pairedControl(child, content[i + 1], content.length === 2, email?.message)

      if (pair) {
        children.push(pair)

        siblings.next()
      } else if (progress?.track === child) {
        issue(child, 'Inferred native progress from the drawn track and its visible percentage.', 'inferred')

        children.push({ kind: 'progress', label: progress.label, value: progress.value })
      } else {
        const value = read(child)

        if (value) children.push(value)
      }
    }

    return children
  }

  const stack = (node: DesignNode, keyed: boolean, read: Reader): NativeNode | null => {
    const layout = node.layout ?? { direction: 'NONE', wrap: false, gap: 0, padding: [] }
    const row = keyed ? choice(node, 'Direction', ['horizontal', 'vertical'], 'vertical') === 'horizontal' : layout.direction === 'HORIZONTAL'
    const wrap = layout.wrap

    if (wrap && platform !== 'react-native') issue(node, 'Wrapping needs a custom native layout. This starter uses one stack.')

    if (!keyed && !['HORIZONTAL', 'VERTICAL'].includes(layout.direction)) issue(node, 'No linear auto layout: review the inferred vertical reading order.')

    const spacing = (value: number, fallback: Gap): Gap => {
      const token = gaps.get(value)

      if (!token) issue(node, `Spacing ${value} has no exact native token; using ${fallback}.`)

      return token ?? fallback
    }

    const gap = keyed ? stackGap(choice(node, 'Gap', Object.keys(stackGaps), 'md')) : spacing(layout.gap, 'md')
    const children = readChildren(node, read)

    if (!children.length) {
      issue(node, 'No exportable visible content in this layout.', 'unsupported')

      return null
    }

    const padding = sides.map((side, i) => ({ side, gap: spacing(layout.padding[i] ?? 0, 'zero') })).filter(edge => edge.gap !== 'zero')

    return { kind: 'stack', row, wrap, gap, padding, children }
  }

  const card = (node: DesignNode): NativeNode => {
    const variant = String(node.properties.Variant ?? 'default').toLowerCase()
    const density = String(node.properties.Density ?? 'default').toLowerCase()

    if (!['default', 'muted'].includes(variant)) issue(node, 'This Card presentation has no verified native mapping; the starter uses the default surface.')

    if (density !== 'default') issue(node, 'Review the Card density; the starter uses the native default padding.')

    return { kind: 'card', variant: variant === 'muted' ? 'muted' : 'default', title: text(node, 'Title', 'Card title'), body: text(node, 'Body', '') }
  }

  const known = (node: DesignNode, component: ComponentName, recurse: Reader): NativeNode | null => {
    if (component === 'Field') return field(node)

    if (component === 'Input') return input(node)

    const renderers = {
      Badge: badge,
      Button: button,
      Card: card,
      Stack: (n: DesignNode) => stack(n, true, recurse),
      CardTitle: (n: DesignNode) => nativeText(n, 'title'),
      CardDescription: (n: DesignNode) => nativeText(n, 'body'),
      Eyebrow: (n: DesignNode) => nativeText(n, 'label')
    } satisfies Record<Exclude<typeof nativeComponents[number], 'Field' | 'Input' | NativeControl>, Reader>

    if (!hasKey(renderers, component)) {
      issue(node, `${component} is a known Lumen component, but this target has no verified export for it.`, 'unsupported')

      return null
    }

    verified(node, component)

    return renderers[component](node)
  }

  const layoutNode = (node: DesignNode, recurse: Reader): NativeNode | null => {
    const group = drawnChoiceGroup(node)

    if (group) {
      issue(node, 'Inferred a radio group from its legend and highlighted option. Native radio indicators replace the artwork.', 'inferred')

      return { kind: 'radioGroup', index: choices.push(group.initial), label: group.label, options: group.options }
    }

    const note = namedLayoutNote(node)

    if (note) issue(node, note, 'inferred')

    return stack(node, false, recurse)
  }

  const read: Reader = node => {
    const component = identifyComponent(node)

    if (component) return known(withPresentationContent(node), component, read)

    if (matchesControl(node, 'Checkbox')) return checkbox(node)

    if (matchesControl(node, 'Progress')) return progressControl(node)

    if (matchesControl(node, 'Label')) {
      verified(node, 'Label')

      return nativeText(node, 'label')
    }

    if (isComponentBoundary(node)) {
      issue(node, 'Unverified library identity. The component and its internals were omitted.', 'unsupported')

      return null
    }

    if (node.type === 'TEXT') return nativeText(node, 'body')

    if (isLayoutLayer(node)) return layoutNode(node, read)

    issue(node, 'Custom layer omitted. Review the original design context.', 'unsupported')

    return null
  }

  const root = read(selection)

  return { root, fields, checks, choices }
}
