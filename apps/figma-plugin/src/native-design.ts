import type { ComponentName } from './contracts.js'
import { identifyComponent, isComponentName, withPresentationContent } from './contracts.js'
import type { DesignNode } from './model.js'
import type { createReview } from './review.js'
import type { NativePlatform } from './targets.js'

// Only these observed library identities have native translations.
export const nativeComponents = ['Button', 'Card', 'Badge', 'Input', 'Field', 'Stack', 'CardTitle', 'CardDescription', 'Eyebrow'] as const satisfies readonly ComponentName[]

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
  { kind: 'card', title: string, body: string } |
  { kind: 'button', label: string, intent: typeof intents[keyof typeof intents], size: Size, disabled: boolean, loading: boolean } |
  { kind: 'badge', label: string, tone: typeof badges[keyof typeof badges] } |
  { kind: 'text', content: string, variant: 'title' | 'body' | 'label', tone: typeof tones[keyof typeof tones] } |
  { kind: 'input', index: number, size: Size, label: string, placeholder: string, helper: string, visibleLabel: boolean }

const inputChildren = (node: DesignNode): DesignNode[] => {
  if (identifyComponent(node) === 'Input') return [node]

  if (node.component || node.type === 'INSTANCE') return []

  return node.children.flatMap(inputChildren)
}

const badgeLabels = (node: DesignNode): string[] => node.type === 'TEXT' && node.name === 'Badge' && node.text !== null ? [node.text] : node.children.flatMap(badgeLabels)

type Review = ReturnType<typeof createReview>

const stackGap = (name: string): Gap => hasKey({ sm: 1, md: 1, lg: 1, xl: 1 }, name) ? name : 'zero'

type Reader = (node: DesignNode) => NativeNode | null

export const nativeDesign = (selection: DesignNode, platform: NativePlatform, { issue, text, choice }: Review) => {
  let fields = 0

  const sizeFor = (node: DesignNode): Size => {
    const value = choice(node, 'Size', ['sm', 'default', 'lg'], 'default')

    return value === 'lg' || value === 'sm' ? value : 'md'
  }

  const verified = (node: DesignNode, name: string) => {
    issue(node, `${name} matches the canonical Lumen library.`, 'verified')

    if (node.type === 'COMPONENT_SET') issue(node, 'Exported the default variant; select an instance to export its configuration.')
  }

  const input = (node: DesignNode, field?: DesignNode): NativeNode => {
    verified(node, 'Input')

    const placeholder = text(node, 'Placeholder', '')
    const label = field ? text(field, 'Label', 'Field label') : placeholder || 'Field label'

    if (!field) issue(node, 'Supply a visible, descriptive field label in the application.')

    if (platform === 'compose' && placeholder && label !== placeholder) issue(node, 'The Compose control accepts a label but no separate placeholder. The placeholder remains in the handoff.')

    issue(node, 'Connect local editing state to the form and supply validation.')

    return { kind: 'input', index: ++fields, size: sizeFor(node), label, placeholder, visibleLabel: Boolean(field), helper: field?.properties['Show helper'] === true ? text(field, 'Helper text', '') : '' }
  }

  const field = (node: DesignNode): NativeNode | null => {
    const controls = node.children.flatMap(inputChildren)
    const control = controls[0]

    if (controls.length !== 1 || !control) {
      issue(node, 'Field requires exactly one verified Input. Review the swapped control.', 'unsupported')

      return null
    }

    verified(node, 'Field')

    return input(control, node)
  }

  const button = (node: DesignNode): NativeNode => {
    const variant = String(node.properties.Variant ?? '').toLowerCase()

    if (!hasKey(intents, variant)) issue(node, 'This Figma button variant has no verified native intent; using secondary.')

    if (node.properties.Icon || String(node.properties.Size).toLowerCase() === 'icon') issue(node, 'Icon swaps and icon-only sizes need a native icon and accessible name. The starter uses the label.')

    issue(node, 'Connect the button action in your application.')

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

    const gap = keyed ? stackGap(choice(node, 'Gap', ['none', 'sm', 'md', 'lg', 'xl'], 'md')) : spacing(layout.gap, 'md')
    const children = node.children.map(read).filter(child => child !== null)

    if (!children.length) {
      issue(node, 'No exportable visible content in this layout.', 'unsupported')

      return null
    }

    const padding = sides.map((side, i) => ({ side, gap: spacing(layout.padding[i] ?? 0, 'zero') })).filter(edge => edge.gap !== 'zero')

    return { kind: 'stack', row, wrap, gap, padding, children }
  }

  const known = (node: DesignNode, component: ComponentName, recurse: Reader): NativeNode | null => {
    if (component === 'Field') return field(node)

    if (component === 'Input') return input(node)

    const renderers = {
      Badge: badge,
      Button: button,
      Card: (n: DesignNode): NativeNode => ({ kind: 'card', title: text(n, 'Title', 'Card title'), body: text(n, 'Body', '') }),
      Stack: (n: DesignNode) => stack(n, true, recurse),
      CardTitle: (n: DesignNode) => nativeText(n, 'title'),
      CardDescription: (n: DesignNode) => nativeText(n, 'body'),
      Eyebrow: (n: DesignNode) => nativeText(n, 'label')
    } satisfies Record<Exclude<typeof nativeComponents[number], 'Field' | 'Input'>, Reader>

    if (!hasKey(renderers, component)) {
      issue(node, `${component} is a known Lumen component, but this target has no verified export for it.`, 'unsupported')

      return null
    }

    verified(node, component)

    return renderers[component](node)
  }

  const read: Reader = node => {
    const component = identifyComponent(node)

    if (component) return known(withPresentationContent(node), component, read)

    if (node.component || node.type === 'INSTANCE' || node.type.startsWith('COMPONENT') || isComponentName(node.name)) {
      issue(node, 'Unverified library identity. The component and its internals were omitted.', 'unsupported')

      return null
    }

    if (node.type === 'TEXT') return nativeText(node, 'body')

    if (['FRAME', 'GROUP', 'SECTION'].includes(node.type)) return stack(node, false, read)

    issue(node, 'Custom layer omitted. Review the original design context.', 'unsupported')

    return null
  }

  const root = read(selection)

  return { root, fields }
}
