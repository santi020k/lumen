import type { ComponentName } from './contracts.js'
import { componentKeys } from './contracts.js'
import type { DesignNode } from './model.js'

export const designNode = (overrides: Partial<DesignNode> = {}): DesignNode => ({
  id: 'fixture-root',
  name: 'Settings',
  type: 'FRAME',
  text: null,
  component: null,
  properties: {},
  layout: { direction: 'VERTICAL', gap: 24, padding: [24, 24, 24, 24], wrap: false },
  tokens: [],
  unboundPaints: 0,
  children: [],
  ...overrides
})

export const componentNode = (name: ComponentName, properties: DesignNode['properties'] = {}, children: DesignNode[] = []): DesignNode => {
  const key = componentKeys[name][0]

  if (!key) throw new Error(`Missing fixture identity for ${name}.`)

  return designNode({ id: `fixture-${name}`, name, type: 'INSTANCE', component: { key, setKey: null, name }, properties, children })
}

export const settingsFixture = designNode({ children: [
  componentNode('Card', { Title: 'Workspace settings', Body: 'Manage the details your team sees.' }),
  componentNode('Tabs', { Active: 'Overview', 'Overview label': 'Profile', 'Details label': 'Team', 'Settings label': 'Preferences' }),
  componentNode('Field', { Label: 'Workspace name', 'Helper text': 'Shown to everyone in your workspace.', 'Show helper': true }, [
    componentNode('Input', { Placeholder: 'Northstar studio', Size: 'Default' })
  ]),
  componentNode('Button', { Label: 'Save changes', Variant: 'Default', Size: 'Default', Loading: false, Disabled: false }),
  componentNode('Dialog', { Title: 'Archive workspace', Description: 'Review the archive action with your team.', 'Show content': true, 'Show actions': true, 'Cancel label': 'Cancel', 'Confirm label': 'Archive' })
] })

export const editorialFixture = componentNode('Stack', { Direction: 'Vertical', Gap: 'Lg' }, [
  componentNode('Badge', { Variant: 'Success' }, [designNode({ type: 'TEXT', name: 'Badge', text: 'Ready' })]),
  componentNode('Code', { Variant: 'Block', Wrap: 'On' }, [designNode({ type: 'TEXT', name: 'Line', text: 'pnpm install' })]),
  componentNode('Eyebrow', { Text: 'Field notes' }),
  componentNode('CardTitle', { Text: 'Release notes' }),
  componentNode('CardDescription', { Text: 'An editorial selection.' }),
  componentNode('Callout', { Title: 'Setup', Body: 'Choose your target.' }),
  componentNode('Note', { Label: 'Tip', 'Show Label': true, Body: 'Use the project palette.', Border: 'Right' }),
  componentNode('Prose', { Heading: 'Getting started', Paragraph: 'Install the adapter.', Subheading: 'Steps', List: '• Install\n• Verify', Link: 'Read more' }),
  componentNode('Timeline', Object.fromEntries([1, 2, 3].flatMap(i => [
    [`Event ${i} title`, `Release ${i}`], [`Event ${i} description`, 'Published'], [`Event ${i} time`, 'Today']
  ]))),
  componentNode('CodeTabs', {
    'Pnpm label': 'pnpm',
    'Npm label': 'npm',
    'Yarn label': 'yarn',
    'Pnpm code': 'pnpm install',
    'Npm code': 'npm install',
    'Yarn code': 'yarn install',
    Copy: true,
    Active: 'Npm',
    Wrap: 'On'
  }),
  componentNode('ThemeToggle'),
  componentNode('RevealGroup', { Once: false, Threshold: '0.25', Delay: '10 ms', Stagger: '40 ms', Animation: 'Slide up', Duration: 'Fast' }, [
    componentNode('ScrollReveal', { Animation: 'Scale' }, [componentNode('Kbd', { Text: 'Enter' })])
  ])
])

// The template contains local field frames, canonical controls, and a drawn progress track.
const owners = {
  Label: 'cf1f941d67edc5ac6bf9157e0a5217927d6671a0',
  Checkbox: '962cdd43e4e24be04ed68f9964c9db3b5f98f6cd',
  Progress: '9a260692bf62accfb6cd13d5caf0189efc8b0260'
}

export const control = (name: keyof typeof owners, properties: DesignNode['properties']) => designNode({ type: 'INSTANCE', name: 'Custom instance name', component: { key: 'variant', setKey: owners[name], name }, properties })
export const frame = (name: string, ...children: DesignNode[]) => designNode({ name, children })
export const copy = (text: string) => designNode({ type: 'TEXT', text })

const field = (label: string, placeholder: string, ...rest: DesignNode[]) => frame('Field', control('Label', { Text: label }), componentNode('Input', { Placeholder: placeholder, Size: 'Default' }), ...rest)

export const caption = (amount: string) => frame('Caption', frame('Span', copy('Setup progress')), frame('Strong', copy(amount)))
export const track = frame('Track', frame('Progress bar'))

const dangerRect = (name: string, field: string) => designNode({ type: 'RECTANGLE', name, tokens: [{ name: 'color/danger', field }] })

export const emailField = field('Work email', 'maya@example', frame('Alert', dangerRect('Danger border', 'strokes'), dangerRect('Danger tint', 'fills'), copy('Enter a complete email address.')), dangerRect('Invalid email outline', 'strokes'))

export const onboardingFixture = frame('Form',
  field('Workspace name', 'Northstar Labs'),
  emailField,
  frame('Options', control('Checkbox', { Checked: 'True' }), frame('Span', copy('Send updates'))),
  frame('Other option', control('Checkbox', { Checked: false }), copy('Send reminders')),
  frame('Setup', caption('50%'), track))

// Exercise every native mapping, nested layout, independent field state and literal escaping in real compilers.
export const nativeFixture = designNode({ children: [
  ...settingsFixture.children,
  ...onboardingFixture.children,
  componentNode('Stack', { Gap: 'Sm', Direction: 'Horizontal' }, [
    componentNode('Eyebrow', { Text: 'Workspace' }),
    componentNode('CardTitle', { Text: 'Settings' }),
    componentNode('CardDescription', { Text: 'Preferences' }),
    componentNode('Input', { Placeholder: 'Search', Size: 'Sm' }),
    componentNode('Badge', { Variant: 'Success' }, [designNode({ type: 'TEXT', name: 'Badge', text: 'Ready' })])
  ]),
  designNode({ type: 'TEXT', text: 'Literal "value"\n${amount} \\(value) <tag/> & 👋', tokens: [{ field: 'fills', name: 'color/ink-muted' }] })
] })
